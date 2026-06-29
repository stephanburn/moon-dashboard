import { describe, it, expect } from 'vitest';
import { moonGeometry } from '../moonDisc';

// Fixed disc geometry for all cases.
const CX = 100;
const CY = 100;
const R = 100;

// Pull the terminator ellipse x-radius (rx) back out of the path string so we
// can assert on the curve shape without re-deriving the whole path here.
function terminatorRx(d: string): number {
  // Path ends with: A rx r 0 0 sweep cx cy-r Z  — the second arc command.
  const arcs = d.match(/A\s+([\d.]+)\s+([\d.]+)/g)!;
  return parseFloat(arcs[1].split(/\s+/)[1]);
}

describe('moonGeometry', () => {
  it('lights the right limb for a waxing northern moon', () => {
    expect(moonGeometry(0.3, true, 'north', CX, CY, R).litRight).toBe(true);
  });

  it('lights the left limb for a waning northern moon', () => {
    expect(moonGeometry(0.3, false, 'north', CX, CY, R).litRight).toBe(false);
  });

  it('mirrors the lit limb in the southern hemisphere', () => {
    expect(moonGeometry(0.3, true, 'south', CX, CY, R).litRight).toBe(false);
    expect(moonGeometry(0.3, false, 'south', CX, CY, R).litRight).toBe(true);
  });

  it('flags gibbous above half and crescent below', () => {
    expect(moonGeometry(0.75, true, 'north', CX, CY, R).gibbous).toBe(true);
    expect(moonGeometry(0.25, true, 'north', CX, CY, R).gibbous).toBe(false);
  });

  it('draws a straight terminator at the quarters (rx ≈ 0)', () => {
    const { litPath } = moonGeometry(0.5, true, 'north', CX, CY, R);
    expect(terminatorRx(litPath)).toBeCloseTo(0, 5);
  });

  it('uses the full radius at new and full (rx ≈ r)', () => {
    expect(terminatorRx(moonGeometry(0, true, 'north', CX, CY, R).litPath)).toBeCloseTo(R, 5);
    expect(terminatorRx(moonGeometry(1, true, 'north', CX, CY, R).litPath)).toBeCloseTo(R, 5);
  });

  it('clamps out-of-range fractions', () => {
    expect(terminatorRx(moonGeometry(-0.2, true, 'north', CX, CY, R).litPath)).toBeCloseTo(R, 5);
    expect(terminatorRx(moonGeometry(1.5, true, 'north', CX, CY, R).litPath)).toBeCloseTo(R, 5);
  });
});
