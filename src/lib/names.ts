// Canonical names used as keys throughout the app. Content records in
// src/data are keyed by these unions, so a missing entry is a compile error.

export const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export type SignName = typeof SIGN_NAMES[number];

export const SIGN_SYMBOLS: Record<SignName, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

export const SABBAT_NAMES = [
  'Imbolc', 'Ostara', 'Beltane', 'Litha', 'Lughnasadh', 'Mabon', 'Samhain', 'Yule',
] as const;

export type SabbatName = typeof SABBAT_NAMES[number];

export const MAJOR_PHASE_NAMES = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'] as const;

export type MajorPhaseName = typeof MAJOR_PHASE_NAMES[number];

export const PHASE_NAMES = [
  'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
] as const;

export type PhaseName = typeof PHASE_NAMES[number];
