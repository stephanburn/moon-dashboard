'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ACCOUNTS_ENABLED, type AccountUser, type MeResponse } from '@/lib/account';
import { canonicalZone } from '@/lib/timezones';
import { saveTimezone } from '@/server/actions';

// 'loading' until /api/me answers (and always while accounts are off);
// 'unavailable' when it failed twice, until a retry succeeds.
export type AccountState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: AccountUser }
  | { status: 'unavailable' };

const RETRY_MS = 3000;

async function fetchMe(): Promise<MeResponse> {
  const res = await fetch('/api/me');
  if (!res.ok) throw new Error(`/api/me answered ${res.status}`);
  return res.json();
}

/**
 * The visitor's account, fetched after mount, plus timezone sync.
 *
 * When signed in, the account's saved zone is applied; if the account has
 * none yet, the zone the dashboard is showing (a saved choice or the
 * browser's own) becomes the account's, since members expect what they see
 * to be what is kept. Later changes on any device update it. `syncFailed` is
 * set while the last save didn't reach the account (the zone is still kept
 * on this device); a save that finds the session gone signs the page out.
 */
export function useAccount(timezone: string, applyTimezone: (tz: string) => void) {
  const [account, setAccount] = useState<AccountState>({ status: 'loading' });
  const [syncFailed, setSyncFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Set when the user picks a zone before /api/me has answered; that fresh
  // choice wins over whatever the account has stored.
  const pickedEarly = useRef(false);
  const applyRef = useRef(applyTimezone);
  const shownRef = useRef(timezone);
  useEffect(() => {
    applyRef.current = applyTimezone;
    shownRef.current = timezone;
  });

  // Server Actions run one at a time per page, so results arrive in order
  // and the last one decides the state.
  const pushTimezone = useCallback((tz: string) => {
    if (!canonicalZone(tz)) return;
    saveTimezone(tz).then(
      result => {
        setSyncFailed(false);
        if (result === 'signed-out') setAccount({ status: 'signed-out' });
      },
      () => setSyncFailed(true),
    );
  }, []);

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
          if (me.timezone && !pickedEarly.current) applyRef.current(me.timezone);
          else pushTimezone(shownRef.current);
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
  }, [attempt, pushTimezone]);

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
      else if (account.status !== 'signed-out') pickedEarly.current = true;
    },
    [account.status, pushTimezone],
  );

  const retrySync = useCallback(() => pushTimezone(shownRef.current), [pushTimezone]);

  return { account, syncFailed, retry, retrySync, timezoneChosen };
}
