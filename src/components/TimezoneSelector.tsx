'use client';

import { AUTO_TIMEZONE, TIMEZONE_GROUPS, listedZoneFor, resolveTimezone } from '@/lib/timezones';

interface Props {
  value: string; // a zone, or AUTO_TIMEZONE to follow the device
  detectedZone: string | null; // the browser's zone, if it reported one
  onChange: (tz: string) => void;
}

const label = (zone: string) => zone.replace(/_/g, ' ');

export default function TimezoneSelector({ value, detectedZone, onChange }: Props) {
  // Zones outside the list (the browser's own, or a saved one from an earlier
  // visit elsewhere) get their own options, so the select always shows the
  // zone actually in use and the browser's zone can be picked again.
  const extraZones = [...new Set([detectedZone, value])]
    .filter((zone): zone is string => !!zone && zone !== AUTO_TIMEZONE && !listedZoneFor(zone));

  return (
    <div className="min-w-0 flex items-center gap-2">
      <span className="text-xs text-text-tertiary tracking-wide hidden sm:block">Timezone</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Timezone"
        className={`
          text-xs bg-white/5 border border-white/10 rounded-md
          text-silver/70 px-2 py-2.5 min-h-[44px] min-w-0
          hover:border-white/20 focus-visible:outline-none focus-visible:border-amber/40 focus-visible:ring-2 focus-visible:ring-amber/40
          transition-colors cursor-pointer
        `}
      >
        <option value={AUTO_TIMEZONE}>Automatic ({label(resolveTimezone(null, detectedZone))})</option>
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
