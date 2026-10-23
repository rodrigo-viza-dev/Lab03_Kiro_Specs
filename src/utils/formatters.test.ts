import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  formatHumidity,
  formatPrecipitation,
  formatTemperature,
} from './formatters';

describe('weather formatters', () => {
  it('Property 11: renders temperature and precipitation with at most one decimal and humidity as an integer', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
        (value) => {
          expect(formatTemperature(value)).toMatch(/^-?\d+(?:\.\d)? °C$/);
          expect(formatPrecipitation(value)).toMatch(/^-?\d+(?:\.\d)? mm$/);
          expect(formatHumidity(value)).toMatch(/^-?\d+ %$/);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('formats representative values with the required units', () => {
    expect(formatTemperature(8.44)).toBe('8.4 °C');
    expect(formatHumidity(72.4)).toBe('72 %');
    expect(formatPrecipitation(0)).toBe('0.0 mm');
  });
});
