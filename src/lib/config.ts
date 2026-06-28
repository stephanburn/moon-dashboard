export const DEFAULT_TZ = 'Europe/London';

// Lookup tables in planets.ts cover up to end of 2027.
// A warning is shown in "Coming Up" within 90 days of this date.
export const PLANET_DATA_EXPIRY = new Date(2027, 11, 31); // 31 Dec 2027

// Solstice/equinox approximation tables in sabbats.ts cover up to end of 2030;
// beyond that, approxDate clamps to the nearest known year (drift ~1 day/decade).
// The planet expiry above fires first, so this is documentation + a coverage
// test rather than a second banner.
export const SABBAT_DATA_EXPIRY = new Date(2030, 11, 31); // 31 Dec 2030
