'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import WheelSelector from '@/components/WheelSelector';
import { safeGet, safeSet } from '@/lib/storage';
import { STORAGE_KEY, detectBrowserTimezone, hemisphereFromTimezone, resolveTimezone } from '@/lib/timezones';
import { WHEEL_STORAGE_KEY, parseWheelChoice, type WheelChoice } from '@/lib/wheel';
import { saveWheel } from '@/server/actions';

// The account's seasonal wheel. Until one is saved, this device's choice is
// shown. 'From timezone' is worked out from the account's zone, else this
// device's, which is only known after mount.
export default function WheelSetting({ saved: initialSaved, timezone }: { saved: WheelChoice | null; timezone: string | null }) {
  const [saved, setSaved] = useState(initialSaved);
  const [device, setDevice] = useState<{ wheel: WheelChoice; timezone: string } | null>(null);
  const [error, setError] = useState<'failed' | 'signed-out' | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDevice({
      wheel: parseWheelChoice(safeGet(WHEEL_STORAGE_KEY)),
      timezone: resolveTimezone(safeGet(STORAGE_KEY), detectBrowserTimezone()),
    });
  }, []);

  if (!device) return null;

  const save = async (wheel: WheelChoice) => {
    setError(null);
    try {
      if ((await saveWheel(wheel)) === 'signed-out') {
        setError('signed-out');
        return;
      }
      safeSet(WHEEL_STORAGE_KEY, wheel);
      setSaved(wheel);
    } catch {
      setError('failed');
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary">
        Which Wheel of the Year the sabbats follow. The moon is still drawn for your timezone.
      </p>
      <WheelSelector
        value={saved ?? device.wheel}
        inferred={hemisphereFromTimezone(timezone ?? device.timezone)}
        onChange={save}
      />
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
