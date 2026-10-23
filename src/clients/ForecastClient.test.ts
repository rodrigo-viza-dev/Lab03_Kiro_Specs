import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { buildForecastUrl, ForecastClient } from './ForecastClient';

describe('ForecastClient', () => {
  it('Property 6: includes valid coordinates and all current weather variables', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
        ),
        ([latitude, longitude]) => {
          const url = buildForecastUrl(latitude, longitude);
          expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
          expect(url.searchParams.get('latitude')).toBe(String(latitude));
          expect(url.searchParams.get('longitude')).toBe(String(longitude));
          expect(url.searchParams.get('current')).toBe(
            'temperature_2m,relative_humidity_2m,precipitation',
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('classifies network failures and timeouts', async () => {
    const networkFailure: typeof fetch = async () => {
      throw new TypeError('Network unavailable');
    };
    await expect(new ForecastClient(networkFailure).getForecast(1, 2)).rejects.toMatchObject({
      type: 'NETWORK_ERROR',
    });

    const timeout: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    await expect(new ForecastClient(timeout, 5).getForecast(1, 2)).rejects.toMatchObject({
      type: 'TIMEOUT',
    });
  });

  it('classifies an unreadable successful response as invalid data', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('{ malformed', { status: 200 }),
    );

    await expect(new ForecastClient(fetcher).getForecast(1, 2)).rejects.toMatchObject({
      type: 'INVALID_RESPONSE',
    });
  });
});
