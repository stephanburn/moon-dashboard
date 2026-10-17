'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ACCOUNTS_ENABLED, type AccountUser, type MeResponse, type SaveResult } from '@/lib/account';
import { canonicalZone } from '@/lib/timezones';
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

async function fetchMe(): Promise<MeResponse> {
  const res = await fetch('/api/me');
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
  useEffect(() => {
    prefsRef.current = prefs;
  });

  // Server Actions run one at a time per page, so results arrive in order
  // and the last one decides the state.
  const push = useCallback((save: () => Promise<SaveResult>) => {
    save().then(
      result => {
        failedSave.current = null;
        setSyncFailed(false);
        if (result === 'signed-out') setAccount({ status: 'signed-out' });
      },
      () => {
        failedSave.current = save;
        setSyncFailed(true);
      },
    );
  }, []);
  const pushTimezone = useCallback(
    (tz: string) => {
      if (canonicalZone(tz)) push(() => saveTimezone(tz));
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
