'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ACCOUNTS_ENABLED, type AccountUser, type MeResponse } from '@/lib/account';
import { canonicalZone } from '@/lib/timezones';
import { saveTimezone } from '@/server/actions';

function pushTimezone(tz: string | null) {
  if (tz && canonicalZone(tz)) saveTimezone(tz).catch(() => {});
}

/**
 * The signed-in user, fetched after mount, plus timezone sync.
 *
 * `user` is undefined until known (and always while accounts are off), null
 * when signed out. When signed in, the account's saved zone is applied; if
 * the account has none yet, the zone the dashboard is showing (a saved choice
 * or the browser's own) becomes the account's, since members expect what they
 * see to be what is kept. Later changes on any device update it.
 */
export function useAccount(timezone: string, applyTimezone: (tz: string) => void) {
  const [user, setUser] = useState<AccountUser | null | undefined>(undefined);
  // Set when the user picks a zone before /api/me has answered; that fresh
  // choice wins over whatever the account has stored.
  const pickedEarly = useRef(false);
  const applyRef = useRef(applyTimezone);
  const shownRef = useRef(timezone);
  useEffect(() => {
    applyRef.current = applyTimezone;
    shownRef.current = timezone;
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
        else pushTimezone(shownRef.current);
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
