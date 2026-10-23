import { describe, expect, it, vi } from 'vitest';
import type { ForecastResult, GeocodingResult } from './types';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { WeatherDisplay } from './components/WeatherDisplay';
import { WeatherController } from './WeatherController';

function setupController(
  geocode: (cityName: string) => Promise<GeocodingResult>,
  getForecast: (latitude: number, longitude: number) => Promise<ForecastResult>,
) {
  document.body.innerHTML = `
    <input id="city" />
    <p id="loading" hidden></p>
    <p id="error" hidden></p>
    <section id="display" hidden></section>
  `;
  const input = document.querySelector<HTMLInputElement>('#city');
  const loading = document.querySelector<HTMLElement>('#loading');
  const error = document.querySelector<HTMLElement>('#error');
  const display = document.querySelector<HTMLElement>('#display');
  if (!input || !loading || !error || !display) {
    throw new Error('Test controller elements not initialized');
  }
  const controller = new WeatherController(
    { geocode },
    { getForecast },
    new WeatherDisplay(display),
    new LoadingIndicator(loading),
    new ErrorMessage(error),
    input,
  );
  return { controller, input, loading, error, display };
}

describe('WeatherController', () => {
  it('Property 13: clears previous display before requesting a new forecast', async () => {
    const geocode = vi.fn(async () => ({
      success: true as const,
      data: { latitude: 51.5, longitude: -0.1, cityName: 'London' },
    }));
    const getForecast = vi.fn(async () => ({
      success: true as const,
      data: { temperature: 12, humidity: 70, precipitation: 0 },
    }));
    const { controller, display } = setupController(geocode, async (latitude, longitude) => {
      expect(latitude).toBe(51.5);
      expect(longitude).toBe(-0.1);
      expect(display.textContent).toBe('');
      return getForecast();
    });

    await controller.search('  London  ');
    expect(geocode).toHaveBeenCalledWith('London');
    expect(getForecast).toHaveBeenCalledOnce();
    expect(display.hidden).toBe(false);
    expect(display.textContent).toContain('London');
    expect(controller.state.status).toBe('success');
  });

  it('shows the API city name fallback and hides loading after success', async () => {
    const geocoding: GeocodingResult = {
      success: true,
      data: { latitude: 0, longitude: 0, cityName: '' },
    };
    const forecast: ForecastResult = {
      success: true,
      data: { temperature: 20, humidity: 50, precipitation: 0 },
    };
    const { controller, loading, display } = setupController(
      async () => geocoding,
      async () => forecast,
    );

    const search = controller.search('User city');
    expect(loading.hidden).toBe(false);
    await search;
    expect(loading.hidden).toBe(true);
    expect(display.textContent).toContain('User city');
  });

  it('shows service errors, preserves the input and clears loading', async () => {
    const { controller, loading, error, input, display } = setupController(
      async () => ({ success: false, error: { type: 'CITY_NOT_FOUND' } }),
      async () => {
        throw new Error('Forecast must not be requested');
      },
    );
    input.value = 'Nowhere';
    display.innerHTML = '<p>Old city</p>';

    await controller.search('Nowhere');

    expect(display.textContent).toBe('');
    expect(error.textContent).toContain('No se encontró la ciudad');
    expect(error.hidden).toBe(false);
    expect(loading.hidden).toBe(true);
    expect(document.activeElement).toBe(input);
    expect(input.disabled).toBe(false);
    expect(controller.state.status).toBe('error');
  });

  it('ignores stale responses when a newer city search has started', async () => {
    let resolveFirst: ((result: GeocodingResult) => void) | undefined;
    const geocode = (cityName: string) =>
      cityName === 'First'
        ? new Promise<GeocodingResult>((resolve) => {
            resolveFirst = resolve;
          })
        : Promise.resolve({
            success: true as const,
            data: { latitude: 2, longitude: 3, cityName: 'Second' },
          });
    const { controller, display, loading } = setupController(
      geocode,
      async () => ({
        success: true,
        data: { temperature: 18, humidity: 65, precipitation: 1 },
      }),
    );

    const firstSearch = controller.search('First');
    await controller.search('Second');
    resolveFirst?.({
      success: true,
      data: { latitude: 1, longitude: 1, cityName: 'First' },
    });
    await firstSearch;

    expect(display.textContent).toContain('Second');
    expect(display.textContent).not.toContain('First');
    expect(loading.hidden).toBe(true);
  });
});
