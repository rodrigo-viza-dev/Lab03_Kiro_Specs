import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { HttpClientError, type JsonHttpResponse } from '../clients/http';
import { GeocodingService } from './GeocodingService';

function makeService(body: unknown, status = 200) {
  const client = {
    geocode: vi.fn<() => Promise<JsonHttpResponse>>().mockResolvedValue({ status, body }),
  };
  return { service: new GeocodingService(client), client };
}

describe('GeocodingService', () => {
  it('Property 4: extracts the first result coordinates without modification', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          latitude: fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
          longitude: fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
          name: fc.string(),
        }),
        async (result) => {
          const { service } = makeService({ results: [result, { latitude: 0, longitude: 0 }] });
          await expect(service.geocode('city')).resolves.toEqual({
            success: true,
            data: {
              latitude: result.latitude,
              longitude: result.longitude,
              cityName: result.name,
            },
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Property 5: treats absent or null coordinates as a city not found', async () => {
    const missing = fc.constantFrom(null, undefined);
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.oneof(missing, fc.double({ min: -90, max: 90 })),
          fc.oneof(missing, fc.double({ min: -180, max: 180 })),
        ).filter(([latitude, longitude]) => latitude == null || longitude == null),
        async ([latitude, longitude]) => {
          const { service } = makeService({ results: [{ latitude, longitude, name: 'X' }] });
          await expect(service.geocode('X')).resolves.toEqual({
            success: false,
            error: { type: 'CITY_NOT_FOUND' },
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it('treats an empty results array as a city not found', async () => {
    const { service } = makeService({ results: [] });
    await expect(service.geocode('Atlantis')).resolves.toEqual({
      success: false,
      error: { type: 'CITY_NOT_FOUND' },
    });
  });

  it('uses the API city name when available and permits its absence for fallback', async () => {
    const { service } = makeService({ results: [{ latitude: 1, longitude: 2 }] });
    await expect(service.geocode('User city')).resolves.toEqual({
      success: true,
      data: { latitude: 1, longitude: 2, cityName: '' },
    });
  });

  it('Property 8: maps every non-2xx response to a geocoding service error', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 300, max: 599 }), async (status) => {
        const { service } = makeService(null, status);
        await expect(service.geocode('city')).resolves.toEqual({
          success: false,
          error: { type: 'SERVICE_ERROR', statusCode: status },
        });
      }),
      { numRuns: 100 },
    );
  });

  it('rejects malformed successful responses', async () => {
    for (const body of [null, 'invalid', { results: 'not-an-array' }]) {
      const { service } = makeService(body);
      await expect(service.geocode('city')).resolves.toEqual({
        success: false,
        error: { type: 'INVALID_RESPONSE' },
      });
    }
  });

  it.each([
    ['NETWORK_ERROR', new HttpClientError('NETWORK_ERROR')],
    ['TIMEOUT', new HttpClientError('TIMEOUT')],
    ['INVALID_RESPONSE', new HttpClientError('INVALID_RESPONSE')],
  ] as const)('maps %s client failures to the corresponding service error', async (type, error) => {
    const client = {
      geocode: vi.fn<() => Promise<JsonHttpResponse>>().mockRejectedValue(error),
    };
    const service = new GeocodingService(client);
    await expect(service.geocode('city')).resolves.toEqual({
      success: false,
      error: { type },
    });
  });
});
