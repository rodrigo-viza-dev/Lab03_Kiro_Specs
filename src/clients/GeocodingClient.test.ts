import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { buildGeocodingUrl, GeocodingClient } from './GeocodingClient';

describe('GeocodingClient', () => {
  it('Property 3: encodes each city name and requests at most one result', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (cityName) => {
        const url = buildGeocodingUrl(cityName);
        expect(url.origin + url.pathname).toBe(
          'https://geocoding-api.open-meteo.com/v1/search',
        );
        expect(url.searchParams.get('name')).toBe(cityName);
        expect(url.searchParams.get('count')).toBe('1');
      }),
      { numRuns: 100 },
    );
  });

  it('reports a timeout when the request is aborted', async () => {
    const fetcher: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    const client = new GeocodingClient(fetcher, 5);

    await expect(client.geocode('Madrid')).rejects.toMatchObject({ type: 'TIMEOUT' });
  });

  it('reports network failures explicitly', async () => {
    const fetcher: typeof fetch = async () => {
      throw new TypeError('Network unavailable');
    };
    const client = new GeocodingClient(fetcher);

    await expect(client.geocode('Madrid')).rejects.toMatchObject({
      type: 'NETWORK_ERROR',
    });
  });

  it('returns non-2xx status without parsing an error response body', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);
    const client = new GeocodingClient(fetcher);

    await expect(client.geocode('Madrid')).resolves.toEqual({ status: 503 });
  });
});
