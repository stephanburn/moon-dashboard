'use client';

import { useEffect } from 'react';
import { STORAGE_KEY } from '@/lib/timezones';

// Backstop: if anything in the dashboard throws at render time, show a recoverable
// screen instead of a blank page. The most likely culprit historically was a bad
// stored timezone reaching Intl.DateTimeFormat, so we offer to clear it and retry.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const clearAndReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore — localStorage may be unavailable
    }
    reset();
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center text-center px-6 gap-4">
      <div className="text-5xl select-none" aria-hidden>
        🌑
      </div>
      <h1 className="font-display text-2xl text-foreground">Something went out of phase</h1>
      <p className="text-sm text-silver/50 max-w-sm">
        The dashboard hit an unexpected error. Resetting your saved timezone usually clears it.
      </p>
      <button
        onClick={clearAndReset}
        className="text-xs bg-white/5 border border-white/10 rounded-md text-silver/70 px-3 py-1.5 hover:border-white/20 transition-colors cursor-pointer"
      >
        Reset and try again
      </button>
    </div>
  );
}
