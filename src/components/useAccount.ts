'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ACCOUNTS_ENABLED,
  announceAccountChange,
  onAccountChange,
  type AccountUser,
  type MeResponse,
  type SaveResult,
} from '@/lib/account';
import { AUTO_TIMEZONE, canonicalZone } from '@/lib/timezones';
import type { WheelChoice } from '@/lib/wheel';
import { saveTimezone, saveWheel } from '@/server/actions';

// 'loading' until /api/me answers (and always while accounts are off);
// 'unavailable' when it failed twice, until a retry succeeds.
export type AccountState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: AccountUser }
  | { status: 'unavailable' };

/** What the dashboard is showing, and how to change it. */
export interface SyncedPreferences {
  timezone: string;
  applyTimezone: (tz: string) => void;
  wheel: WheelChoice;
  applyWheel: (wheel: WheelChoice) => void;
}

const RETRY_MS = 3000;
// A tab shown again re-checks the account at most this often.
const RECHECK_MS = 10 * 60_000;
// Another tab's sign-out may still be on its way to the server when it
// announces it, so a second check follows the first.
const ANNOUNCE_FOLLOW_UP_MS = 2000;

// `check` asks /api/me not to count a visit: the page didn't load again.
async function fetchMe(check = false): Promise<MeResponse> {
  const res = await fetch(check ? '/api/me?check=1' : '/api/me');
  if (!res.ok) throw new Error(`/api/me answered ${res.status}`);
  return res.json();
}

/**
 * The visitor's account, fetched after mount, plus preference sync.
 *
 * When signed in, the account's saved timezone and seasonal wheel are
 * applied. If the account has no zone yet, the zone the dashboard is showing
 * (a saved choice or the browser's own) becomes the account's, since members
 * expect what they see to be what is kept; a wheel chosen on this device is
 * uploaded the same way. Later changes on any device update them.
 * `syncFailed` is set while the last save didn't reach the account (the
 * choice is still kept on this device); a save that finds the session gone
 * signs the page out.
 */
export function useAccount(prefs: SyncedPreferences) {
  const [account, setAccount] = useState<AccountState>({ status: 'loading' });
  const [syncFailed, setSyncFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Set when the user picks before /api/me has answered; that fresh choice
  // wins over whatever the account has stored.
  const pickedEarly = useRef({ timezone: false, wheel: false });
  const prefsRef = useRef(prefs);
  const failedSave = useRef<(() => Promise<SaveResult>) | null>(null);
  // When the account was last fetched, and its status as of the last render.
  const lastCheck = useRef(0);
  const statusRef = useRef(account.status);
  useEffect(() => {
    prefsRef.current = prefs;
    statusRef.current = account.status;
  });

  // Server Actions run one at a time per page, so results arrive in order
  // and the last one decides the state.
  const push = useCallback((save: () => Promise<SaveResult>) => {
    save().then(
      result => {
        failedSave.current = null;
        setSyncFailed(false);
        if (result === 'signed-out') {
          setAccount({ status: 'signed-out' });
          announceAccountChange();
        }
      },
      () => {
        failedSave.current = save;
        setSyncFailed(true);
      },
    );
  }, []);
  const pushTimezone = useCallback(
    (tz: string) => {
      if (tz === AUTO_TIMEZONE || canonicalZone(tz)) push(() => saveTimezone(tz));
    },
    [push],
  );
  const pushWheel = useCallback((wheel: WheelChoice) => push(() => saveWheel(wheel)), [push]);

  useEffect(() => {
    if (!ACCOUNTS_ENABLED) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = (retried: boolean) => {
      fetchMe().then(
        me => {
          if (cancelled) return;
          if (!me.user) {
            setAccount({ status: 'signed-out' });
            return;
          }
          setAccount({ status: 'signed-in', user: me.user });
          lastCheck.current = Date.now();
          const shown = prefsRef.current;
          if (me.timezone && !pickedEarly.current.timezone) shown.applyTimezone(me.timezone);
          else pushTimezone(shown.timezone);
          if (me.wheel && !pickedEarly.current.wheel) shown.applyWheel(me.wheel);
          else if (shown.wheel !== (me.wheel ?? 'auto')) pushWheel(shown.wheel);
        },
        () => {
          if (cancelled) return;
          if (retried) setAccount({ status: 'unavailable' });
          else timer = setTimeout(() => load(true), RETRY_MS);
        },
      );
    };
    load(false);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [attempt, pushTimezone, pushWheel]);

  const retry = useCallback(() => {
    setAccount({ status: 'loading' });
    setAttempt(n => n + 1);
  }, []);

  // Checks again, without counting a visit, when the tab is shown after a
  // while or another tab announces a change. A sign-in elsewhere gets the
  // full load, so the account's settings are applied; otherwise only the
  // signed-in state and profile are refreshed, so a local choice whose save
  // failed isn't overwritten.
  const recheck = useCallback(() => {
    const status = statusRef.current;
    if (status !== 'signed-in' && status !== 'signed-out') return;
    lastCheck.current = Date.now();
    fetchMe(true).then(
      me => {
        if (!me.user) setAccount({ status: 'signed-out' });
        else if (statusRef.current === 'signed-in') setAccount({ status: 'signed-in', user: me.user });
        else retry();
      },
      () => {},
    );
  }, [retry]);

  useEffect(() => {
    if (!ACCOUNTS_ENABLED) return;
    let followUp: ReturnType<typeof setTimeout> | undefined;
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck.current > RECHECK_MS) recheck();
    };
    document.addEventListener('visibilitychange', onVisible);
    const stopListening = onAccountChange(() => {
      recheck();
      clearTimeout(followUp);
      followUp = setTimeout(recheck, ANNOUNCE_FOLLOW_UP_MS);
    });
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      stopListening();
      clearTimeout(followUp);
    };
  }, [recheck]);

  // Coming back to an unavailable page tries again by itself.
  const unavailable = account.status === 'unavailable';
  useEffect(() => {
    if (!unavailable) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') retry();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [unavailable, retry]);

  const timezoneChosen = useCallback(
    (tz: string) => {
      if (account.status === 'signed-in') pushTimezone(tz);
      else if (account.status !== 'signed-out') pickedEarly.current.timezone = true;
    },
    [account.status, pushTimezone],
  );

  const wheelChosen = useCallback(
    (wheel: WheelChoice) => {
      if (account.status === 'signed-in') pushWheel(wheel);
      else if (account.status !== 'signed-out') pickedEarly.current.wheel = true;
    },
    [account.status, pushWheel],
  );

  const retrySync = useCallback(() => {
    if (failedSave.current) push(failedSave.current);
  }, [push]);

  return { account, syncFailed, retry, retrySync, timezoneChosen, wheelChosen };
}
