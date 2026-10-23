import { requestJson, type JsonHttpResponse } from './http';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const CURRENT_VARIABLES = 'temperature_2m,relative_humidity_2m,precipitation';
const DEFAULT_TIMEOUT_MS = 10_000;

export function buildForecastUrl(latitude: number, longitude: number): URL {
  const url = new URL(FORECAST_URL);
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', CURRENT_VARIABLES);
  return url;
}

export class ForecastClient {
  constructor(
    private readonly fetcher: typeof fetch = fetch,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  getForecast(latitude: number, longitude: number): Promise<JsonHttpResponse> {
    return requestJson(
      buildForecastUrl(latitude, longitude),
      this.fetcher,
      this.timeoutMs,
    );
  }
}
