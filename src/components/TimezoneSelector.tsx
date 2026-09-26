'use client';

import { TIMEZONE_GROUPS, listedZoneFor } from '@/lib/timezones';

interface Props {
  value: string;
  detectedZone: string | null; // the browser's zone, if it reported one
  onChange: (tz: string) => void;
}

const label = (zone: string) => zone.replace(/_/g, ' ');

export default function TimezoneSelector({ value, detectedZone, onChange }: Props) {
  // Zones outside the list (the browser's own, or a saved one from an earlier
  // visit elsewhere) get their own options, so the select always shows the
  // zone actually in use and the browser's zone can be picked again.
  const extraZones = [...new Set([detectedZone, value])]
    .filter((zone): zone is string => !!zone && !listedZoneFor(zone));

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-silver/50 tracking-wide hidden sm:block">Timezone</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Timezone"
        className="
          text-xs bg-white/5 border border-white/10 rounded-md
          text-silver/70 px-2 py-2.5 min-h-[44px] max-w-[42vw] sm:max-w-none
          hover:border-white/20 focus-visible:outline-none focus-visible:border-amber/40 focus-visible:ring-2 focus-visible:ring-amber/40
          transition-colors cursor-pointer
        "
      >
        {extraZones.map(zone => (
          <option key={zone} value={zone}>
            {zone === detectedZone ? `${label(zone)} (your timezone)` : label(zone)}
          </option>
        ))}
        {TIMEZONE_GROUPS.map(group => (
          <optgroup key={group.label} label={group.label}>
            {group.zones.map(zone => (
              <option key={zone} value={zone}>
                {label(zone)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
