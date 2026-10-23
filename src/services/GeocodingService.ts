import { HttpClientError, type JsonHttpResponse } from '../clients/http';
import type { GeocodingResult } from '../types';
import { GeocodingClient } from '../clients/GeocodingClient';

interface GeocodingClientLike {
  geocode(cityName: string): Promise<JsonHttpResponse>;
}

export class GeocodingService {
  constructor(private readonly client: GeocodingClientLike = new GeocodingClient()) {}

  async geocode(cityName: string): Promise<GeocodingResult> {
    try {
      const response = await this.client.geocode(cityName);
      if (response.status < 200 || response.status >= 300) {
        return {
          success: false,
          error: { type: 'SERVICE_ERROR', statusCode: response.status },
        };
      }

      if (!isRecord(response.body)) {
        return { success: false, error: { type: 'INVALID_RESPONSE' } };
      }

      const results = response.body.results;
      if (results === undefined || (Array.isArray(results) && results.length === 0)) {
        return { success: false, error: { type: 'CITY_NOT_FOUND' } };
      }
      if (!Array.isArray(results)) {
        return { success: false, error: { type: 'INVALID_RESPONSE' } };
      }

      const first = results[0];
      if (!isRecord(first)) {
        return { success: false, error: { type: 'CITY_NOT_FOUND' } };
      }

      const { latitude, longitude, name } = first;
      if (
        typeof latitude !== 'number' ||
        !Number.isFinite(latitude) ||
        typeof longitude !== 'number' ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return { success: false, error: { type: 'CITY_NOT_FOUND' } };
      }

      return {
        success: true,
        data: {
          latitude,
          longitude,
          cityName: typeof name === 'string' ? name : '',
        },
      };
    } catch (error) {
      return { success: false, error: mapClientError(error) };
    }
  }
}

function mapClientError(error: unknown): Extract<GeocodingResult, { success: false }>['error'] {
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
