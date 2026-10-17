'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { STORAGE_KEY } from '@/lib/timezones';
import { safeRemove } from '@/lib/storage';

// Backstop: if anything throws at render time, show a recoverable screen
// instead of a blank page. On the dashboard the most likely culprit
// historically was a bad stored timezone reaching Intl.DateTimeFormat, so there
// we offer to clear it and retry. Elsewhere, and for errors from the server
// (which carry a digest), it's more likely the database or sign-in, where
// clearing the zone wouldn't help.
export default function Error({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const zoneMayBeAtFault = usePathname() === '/' && !error.digest;

  const clearAndReset = () => {
    safeRemove(STORAGE_KEY);
    reset();
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center text-center px-6 gap-4">
      <div className="text-5xl select-none" aria-hidden>
        🌑
      </div>
      <h1 className="font-display text-2xl text-foreground">Something went out of phase</h1>
      <p className="text-sm text-text-secondary max-w-sm">
        {zoneMayBeAtFault
          ? 'The dashboard hit an unexpected error. Resetting your saved timezone usually clears it.'
          : 'This page hit an unexpected error. Please try again in a moment.'}
      </p>
      <button
        onClick={zoneMayBeAtFault ? clearAndReset : retry}
        className="text-xs bg-white/5 border border-white/10 rounded-md text-silver/70 px-3 py-1.5 hover:border-white/20 transition-colors cursor-pointer"
      >
        {zoneMayBeAtFault ? 'Reset and try again' : 'Try again'}
      </button>
    </div>
  );
}
