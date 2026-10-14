'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ACCOUNTS_ENABLED, type AccountUser, type MeResponse } from '@/lib/account';
import { safeGet } from '@/lib/storage';
import { STORAGE_KEY, canonicalZone } from '@/lib/timezones';
import { saveTimezone } from '@/server/actions';

function pushTimezone(tz: string | null) {
  if (tz && canonicalZone(tz)) saveTimezone(tz).catch(() => {});
}

/**
 * The signed-in user, fetched after mount, plus timezone sync.
 *
 * `user` is undefined until known (and always while accounts are off), null
 * when signed out. Only explicit choices are synced, never the detected zone:
 * on sign-in the account's saved zone is applied, or, if the account has none
 * yet, this device's saved choice is uploaded.
 */
export function useAccount(applyTimezone: (tz: string) => void) {
  const [user, setUser] = useState<AccountUser | null | undefined>(undefined);
  // Set when the user picks a zone before /api/me has answered; that fresh
  // choice wins over whatever the account has stored.
  const pickedEarly = useRef(false);
  const applyRef = useRef(applyTimezone);
  useEffect(() => {
    applyRef.current = applyTimezone;
  });

  useEffect(() => {
    if (!ACCOUNTS_ENABLED) return;
    let cancelled = false;
    fetch('/api/me')
      .then(res => (res.ok ? (res.json() as Promise<MeResponse>) : null))
      .then(me => {
        if (cancelled || !me) return;
        setUser(me.user);
        if (!me.user) return;
        if (me.timezone && !pickedEarly.current) applyRef.current(me.timezone);
        else pushTimezone(safeGet(STORAGE_KEY));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const timezoneChosen = useCallback(
    (tz: string) => {
      if (user) pushTimezone(tz);
      else if (user === undefined) pickedEarly.current = true;
    },
    [user],
  );

  return { user, timezoneChosen };
}
