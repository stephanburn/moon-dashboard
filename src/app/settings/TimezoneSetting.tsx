'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import TimezoneSelector from '@/components/TimezoneSelector';
import { safeGet, safeRemove, safeSet } from '@/lib/storage';
import { AUTO_TIMEZONE, STORAGE_KEY, detectBrowserTimezone, normalizeTimezone, resolveTimezone } from '@/lib/timezones';
import { saveTimezone } from '@/server/actions';

const label = (zone: string) => zone.replace(/_/g, ' ');

// The account's timezone. The dashboard saves the zone it shows on the first
// signed-in visit, so "not saved" is rare here; it still offers this device's
// zone so it can be kept with one tap.
export default function TimezoneSetting({ saved: initialSaved }: { saved: string | null }) {
  const [saved, setSaved] = useState(initialSaved);
  // This device's zone and the browser's own, known only after mount.
  const [deviceZone, setDeviceZone] = useState<string | null>(null);
  const [detectedZone, setDetectedZone] = useState<string | null>(null);
  const [error, setError] = useState<'failed' | 'signed-out' | null>(null);

  useEffect(() => {
    const detected = detectBrowserTimezone();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetectedZone(detected);
    setDeviceZone(resolveTimezone(safeGet(STORAGE_KEY), detected));
  }, []);

  const save = async (tz: string) => {
    const choice = tz === AUTO_TIMEZONE ? AUTO_TIMEZONE : normalizeTimezone(tz);
    setError(null);
    try {
      if ((await saveTimezone(choice)) === 'signed-out') {
        setError('signed-out');
        return;
      }
      if (choice === AUTO_TIMEZONE) {
        safeRemove(STORAGE_KEY);
        setDeviceZone(resolveTimezone(null, detectedZone));
      } else {
        safeSet(STORAGE_KEY, choice);
        setDeviceZone(choice);
      }
      setSaved(choice);
    } catch {
      setError('failed');
    }
  };

  const shown = saved ?? deviceZone;

  return (
    <div className="space-y-3">
      {saved === AUTO_TIMEZONE ? (
        <p className="text-sm text-text-secondary">
          Automatic: each device uses its own timezone.
          {deviceZone && <> This one is using <span className="text-foreground">{label(deviceZone)}</span>.</>}
        </p>
      ) : saved ? (
        <p className="text-sm text-text-secondary">
          <span className="text-foreground">{label(saved)}</span>, used on every device you sign in on.
        </p>
      ) : (
        <p className="text-sm text-text-secondary">
          No timezone saved yet.
          {deviceZone && <> This one is using <span className="text-foreground">{label(deviceZone)}</span>.</>}
        </p>
      )}
      {shown && (
        <div className="flex flex-wrap items-center gap-3">
          {!saved && (
            <button
              type="button"
              onClick={() => save(shown)}
              className="min-h-[44px] px-4 rounded-lg border border-amber/40 bg-amber/10 text-sm text-amber-light hover:border-amber/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber/40"
            >
              Use {label(shown)} everywhere
            </button>
          )}
          <TimezoneSelector value={shown} detectedZone={detectedZone} onChange={save} />
        </div>
      )}
      {error === 'failed' && (
        <p role="alert" className="text-sm text-amber-light">Couldn&apos;t save that. Please try again.</p>
      )}
      {error === 'signed-out' && (
        <p role="alert" className="text-sm text-amber-light">
          You&apos;ve been signed out, so that wasn&apos;t saved.{' '}
          <Link href="/signin" className="underline hover:text-foreground">Sign in again</Link>
        </p>
      )}
    </div>
  );
}
