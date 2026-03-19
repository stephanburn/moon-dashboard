'use client';

import { useEffect, useState } from 'react';

const TIMEZONE_GROUPS: { label: string; zones: string[] }[] = [
  {
    label: 'Europe',
    zones: [
      'Europe/London',
      'Europe/Dublin',
      'Europe/Lisbon',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Amsterdam',
      'Europe/Brussels',
      'Europe/Madrid',
      'Europe/Rome',
      'Europe/Vienna',
      'Europe/Warsaw',
      'Europe/Stockholm',
      'Europe/Oslo',
      'Europe/Copenhagen',
      'Europe/Helsinki',
      'Europe/Athens',
      'Europe/Bucharest',
      'Europe/Kyiv',
      'Europe/Moscow',
    ],
  },
  {
    label: 'Americas',
    zones: [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'America/Halifax',
      'America/Toronto',
      'America/Vancouver',
      'America/Mexico_City',
      'America/Bogota',
      'America/Lima',
      'America/Santiago',
      'America/Sao_Paulo',
      'America/Buenos_Aires',
      'Pacific/Honolulu',
    ],
  },
  {
    label: 'Asia / Pacific',
    zones: [
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Dhaka',
      'Asia/Bangkok',
      'Asia/Singapore',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Perth',
      'Pacific/Auckland',
      'Pacific/Fiji',
    ],
  },
  {
    label: 'Africa',
    zones: [
      'Africa/Cairo',
      'Africa/Johannesburg',
      'Africa/Lagos',
      'Africa/Nairobi',
    ],
  },
];

const STORAGE_KEY = 'moon-dashboard-timezone';
const DEFAULT_TZ = 'Europe/London';

interface Props {
  onChange: (tz: string) => void;
}

export default function TimezoneSelector({ onChange }: Props) {
  const [selected, setSelected] = useState(DEFAULT_TZ);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setSelected(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      onChange(selected);
    }
  }, [selected, mounted, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tz = e.target.value;
    setSelected(tz);
    localStorage.setItem(STORAGE_KEY, tz);
    onChange(tz);
  };

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-silver/50 tracking-wide hidden sm:block">Timezone</span>
      <select
        value={selected}
        onChange={handleChange}
        className="
          text-xs bg-white/5 border border-white/10 rounded-md
          text-silver/70 px-2 py-1
          hover:border-white/20 focus:outline-none focus:border-amber/40
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
