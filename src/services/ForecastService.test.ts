import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { HttpClientError, type JsonHttpResponse } from '../clients/http';
import { ForecastService } from './ForecastService';

function makeService(body: unknown, status = 200) {
  const client = {
    getForecast: vi.fn<() => Promise<JsonHttpResponse>>().mockResolvedValue({ status, body }),
  };
  return { service: new ForecastService(client), client };
}

const weatherArbitrary = fc.record({
  temperature_2m: fc.double({ noNaN: true, noDefaultInfinity: true }),
  relative_humidity_2m: fc.double({ noNaN: true, noDefaultInfinity: true }),
  precipitation: fc.double({ noNaN: true, noDefaultInfinity: true }),
});

describe('ForecastService', () => {
  it('Property 7: maps current values to WeatherData without changing them', async () => {
    await fc.assert(
      fc.asyncProperty(weatherArbitrary, async (current) => {
        const { service } = makeService({ current });
        await expect(service.getForecast(10, 20)).resolves.toEqual({
          success: true,
          data: {
            temperature: current.temperature_2m,
            humidity: current.relative_humidity_2m,
            precipitation: current.precipitation,
          },
        });
      }),
      { numRuns: 100 },
    );
  });

  it('Property 8: maps every non-2xx response to a forecast service error', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 300, max: 599 }), async (status) => {
        const { service } = makeService(null, status);
        await expect(service.getForecast(10, 20)).resolves.toEqual({
          success: false,
          error: { type: 'SERVICE_ERROR', statusCode: status },
        });
      }),
      { numRuns: 100 },
    );
  });

  it('Property 9: rejects successful responses with an invalid body', async () => {
    for (const body of [null, 'invalid', {}, { current: 'invalid' }]) {
      const { service } = makeService(body);
      await expect(service.getForecast(10, 20)).resolves.toEqual({
        success: false,
        error: { type: 'INVALID_RESPONSE' },
      });
    }
  });

  it('Property 10: reports incomplete data when any weather field is missing or null', async () => {
    const keys = [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
    ] as const;
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(fc.constantFrom(...keys), fc.constantFrom(null, undefined)),
        async ([missingKey, missingValue]) => {
          const current: Record<string, unknown> = {
            temperature_2m: 12,
            relative_humidity_2m: 45,
            precipitation: 0,
            [missingKey]: missingValue,
          };
          const { service } = makeService({ current });
          await expect(service.getForecast(10, 20)).resolves.toEqual({
            success: false,
            error: { type: 'INCOMPLETE_DATA' },
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it.each([
    ['NETWORK_ERROR', new HttpClientError('NETWORK_ERROR')],
    ['TIMEOUT', new HttpClientError('TIMEOUT')],
    ['INVALID_RESPONSE', new HttpClientError('INVALID_RESPONSE')],
  ] as const)('maps %s client failures to the corresponding service error', async (type, error) => {
    const client = {
      getForecast: vi.fn<() => Promise<JsonHttpResponse>>().mockRejectedValue(error),
    };
    const service = new ForecastService(client);
    await expect(service.getForecast(10, 20)).resolves.toEqual({
      success: false,
      error: { type },
    });
  });
});
