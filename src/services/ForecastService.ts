import { ForecastClient } from '../clients/ForecastClient';
import { HttpClientError, type JsonHttpResponse } from '../clients/http';
import type { ForecastResult } from '../types';

interface ForecastClientLike {
  getForecast(latitude: number, longitude: number): Promise<JsonHttpResponse>;
}

export class ForecastService {
  constructor(private readonly client: ForecastClientLike = new ForecastClient()) {}

  async getForecast(latitude: number, longitude: number): Promise<ForecastResult> {
    try {
      const response = await this.client.getForecast(latitude, longitude);
      if (response.status < 200 || response.status >= 300) {
        return {
          success: false,
          error: { type: 'SERVICE_ERROR', statusCode: response.status },
        };
      }

      if (!isRecord(response.body) || !isRecord(response.body.current)) {
        return { success: false, error: { type: 'INVALID_RESPONSE' } };
      }

      const { temperature_2m, relative_humidity_2m, precipitation } =
        response.body.current;
      if (
        temperature_2m === null ||
        temperature_2m === undefined ||
        relative_humidity_2m === null ||
        relative_humidity_2m === undefined ||
        precipitation === null ||
        precipitation === undefined
      ) {
        return { success: false, error: { type: 'INCOMPLETE_DATA' } };
      }
      if (
        typeof temperature_2m !== 'number' ||
        !Number.isFinite(temperature_2m) ||
        typeof relative_humidity_2m !== 'number' ||
        !Number.isFinite(relative_humidity_2m) ||
        typeof precipitation !== 'number' ||
        !Number.isFinite(precipitation)
      ) {
        return { success: false, error: { type: 'INVALID_RESPONSE' } };
      }

      return {
        success: true,
        data: {
          temperature: temperature_2m,
          humidity: relative_humidity_2m,
          precipitation,
        },
      };
    } catch (error) {
      return { success: false, error: mapClientError(error) };
    }
  }
}

function mapClientError(error: unknown): Extract<ForecastResult, { success: false }>['error'] {
  if (error instanceof HttpClientError) {
    if (error.type === 'NETWORK_ERROR' || error.type === 'TIMEOUT') {
      return { type: error.type };
    }
    return { type: 'INVALID_RESPONSE' };
  }
  throw error;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
