import { hemisphereFromTimezone, type Hemisphere } from './timezones';

// Which Wheel of the Year to follow. 'auto' takes it from the timezone; an
// explicit choice keeps someone's own seasons whatever zone they read times
// in. It moves only the sabbats and their seasonal text: the moon is still
// drawn for the timezone's hemisphere, the nearest thing to where the viewer
// stands.
export type WheelChoice = 'auto' | Hemisphere;

export const WHEEL_CHOICES: readonly WheelChoice[] = ['auto', 'north', 'south'];

// Persisted in localStorage by Dashboard (via lib/storage).
export const WHEEL_STORAGE_KEY = 'moon-dashboard-wheel';

/** A stored or submitted value as a choice; anything unknown is 'auto'. */
export function parseWheelChoice(value: unknown): WheelChoice {
  return WHEEL_CHOICES.find(choice => choice === value) ?? 'auto';
}

export function resolveWheel(choice: WheelChoice, timezone: string, at: Date): Hemisphere {
  return choice === 'auto' ? hemisphereFromTimezone(timezone, at) : choice;
}
