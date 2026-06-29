'use client';

import { TIMEZONE_GROUPS } from '@/lib/timezones';

interface Props {
  value: string;
  onChange: (tz: string) => void;
}

export default function TimezoneSelector({ value, onChange }: Props) {
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
        {TIMEZONE_GROUPS.map(group => (
          <optgroup key={group.label} label={group.label}>
            {group.zones.map(zone => (
              <option key={zone} value={zone}>
                {zone.replace(/_/g, ' ')}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
