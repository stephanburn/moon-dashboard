import { describe, it, expect } from 'vitest';
import { MOON_CORRESPONDENCES } from '@/data/moonCorrespondences';
import { MOON_SIGN_CORRESPONDENCES } from '@/data/moonSignCorrespondences';
import { SABBAT_CORRESPONDENCES } from '@/data/sabbatCorrespondences';
import { VENUS_CORRESPONDENCES } from '@/data/venusCorrespondences';
import { ZODIAC_CORRESPONDENCES } from '@/data/zodiacCorrespondences';
import { MERCURY_RETROGRADE_CORRESPONDENCES } from '@/data/mercuryRetrogradeCorrespondences';

// House style for user-facing copy: no em dashes (see commit 89e6021).
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('correspondence content', () => {
  const all = {
    MOON_CORRESPONDENCES,
    MOON_SIGN_CORRESPONDENCES,
    SABBAT_CORRESPONDENCES,
    VENUS_CORRESPONDENCES,
    ZODIAC_CORRESPONDENCES,
    MERCURY_RETROGRADE_CORRESPONDENCES,
  };

  for (const [name, records] of Object.entries(all)) {
    it(`${name} contains no em dashes`, () => {
      expect(strings(records).filter(s => s.includes('—'))).toEqual([]);
    });
  }
});
