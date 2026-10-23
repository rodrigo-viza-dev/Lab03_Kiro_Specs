import { requestJson, type JsonHttpResponse } from './http';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const DEFAULT_TIMEOUT_MS = 10_000;

export function buildGeocodingUrl(cityName: string): URL {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set('name', cityName);
  url.searchParams.set('count', '1');
  return url;
}

export class GeocodingClient {
  constructor(
    private readonly fetcher: typeof fetch = fetch,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  geocode(cityName: string): Promise<JsonHttpResponse> {
    return requestJson(buildGeocodingUrl(cityName), this.fetcher, this.timeoutMs);
  }
}
