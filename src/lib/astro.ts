export interface ZodiacSign {
  name: string;
  symbol: string;
  startMonth: number; // 1-based
  startDay: number;
  endMonth: number;
  endDay: number;
}

export interface SunSignInfo {
  sign: ZodiacSign;
  transitStart: Date;
  transitEnd: Date;
}

export interface NextIngress {
  sign: ZodiacSign;
  date: Date;
}

const ZODIAC_SIGNS: ZodiacSign[] = [
  { name: 'Capricorn',    symbol: '♑', startMonth: 12, startDay: 22, endMonth: 1,  endDay: 19 },
  { name: 'Aquarius',     symbol: '♒', startMonth: 1,  startDay: 20, endMonth: 2,  endDay: 18 },
  { name: 'Pisces',       symbol: '♓', startMonth: 2,  startDay: 19, endMonth: 3,  endDay: 20 },
  { name: 'Aries',        symbol: '♈', startMonth: 3,  startDay: 21, endMonth: 4,  endDay: 19 },
  { name: 'Taurus',       symbol: '♉', startMonth: 4,  startDay: 20, endMonth: 5,  endDay: 20 },
  { name: 'Gemini',       symbol: '♊', startMonth: 5,  startDay: 21, endMonth: 6,  endDay: 20 },
  { name: 'Cancer',       symbol: '♋', startMonth: 6,  startDay: 21, endMonth: 7,  endDay: 22 },
  { name: 'Leo',          symbol: '♌', startMonth: 7,  startDay: 23, endMonth: 8,  endDay: 22 },
  { name: 'Virgo',        symbol: '♍', startMonth: 8,  startDay: 23, endMonth: 9,  endDay: 22 },
  { name: 'Libra',        symbol: '♎', startMonth: 9,  startDay: 23, endMonth: 10, endDay: 22 },
  { name: 'Scorpio',      symbol: '♏', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { name: 'Sagittarius',  symbol: '♐', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
];

function dateMatchesSign(month: number, day: number, sign: ZodiacSign): boolean {
  const start = sign.startMonth * 100 + sign.startDay;
  const end   = sign.endMonth   * 100 + sign.endDay;
  const cur   = month * 100 + day;

  if (start > end) {
    // Wraps year boundary (Capricorn: Dec 22 – Jan 19)
    return cur >= start || cur <= end;
  }
  return cur >= start && cur <= end;
}

export function getCurrentSunSign(date: Date = new Date()): SunSignInfo {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  const sign = ZODIAC_SIGNS.find(s => dateMatchesSign(month, day, s))!;

  // Determine the transit start date for this year
  let startYear = year;
  if (sign.name === 'Capricorn' && month === 1) {
    startYear = year - 1;
  }
  const transitStart = new Date(startYear, sign.startMonth - 1, sign.startDay);

  // Determine the transit end date for this year
  let endYear = year;
  if (sign.name === 'Capricorn' && month === 12) {
    endYear = year + 1;
  }
  const transitEnd = new Date(endYear, sign.endMonth - 1, sign.endDay);

  return { sign, transitStart, transitEnd };
}

export function getNextSunSignIngress(date: Date = new Date()): NextIngress {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  // Find current sign index
  const currentIndex = ZODIAC_SIGNS.findIndex(s => dateMatchesSign(month, day, s));
  const nextIndex = (currentIndex + 1) % ZODIAC_SIGNS.length;
  const nextSign = ZODIAC_SIGNS[nextIndex];

  // Work out what year the next sign starts
  let nextYear = year;
  if (nextSign.startMonth < month || (nextSign.startMonth === month && nextSign.startDay <= day)) {
    nextYear = year + 1;
  }

  return {
    sign: nextSign,
    date: new Date(nextYear, nextSign.startMonth - 1, nextSign.startDay),
  };
}
