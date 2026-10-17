'use client';

import type { Hemisphere } from '@/lib/timezones';
import { parseWheelChoice, type WheelChoice } from '@/lib/wheel';

interface Props {
  value: WheelChoice;
  inferred: Hemisphere; // what 'auto' means for the current timezone
  onChange: (choice: WheelChoice) => void;
}

const NAMES: Record<Hemisphere, string> = { north: 'Northern', south: 'Southern' };

export default function WheelSelector({ value, inferred, onChange }: Props) {
  return (
    <label className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
      Seasonal wheel
      <select
        value={value}
        onChange={e => onChange(parseWheelChoice(e.target.value))}
        className="text-xs bg-white/5 border border-white/10 rounded-md text-text-secondary px-2 py-2.5 min-h-[44px] hover:border-white/20 focus-visible:outline-none focus-visible:border-amber/40 focus-visible:ring-2 focus-visible:ring-amber/40 transition-colors cursor-pointer"
      >
        <option value="auto">From timezone ({NAMES[inferred]})</option>
        <option value="north">Northern Hemisphere</option>
        <option value="south">Southern Hemisphere</option>
      </select>
    </label>
  );
}
