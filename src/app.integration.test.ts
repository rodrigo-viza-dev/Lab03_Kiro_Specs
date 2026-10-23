import { fireEvent } from '@testing-library/dom';
import { describe, expect, it, vi } from 'vitest';
import { CitySearchForm } from './components/CitySearchForm';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { WeatherDisplay } from './components/WeatherDisplay';
import type { ForecastResult, GeocodingResult } from './types';
import { WeatherController } from './WeatherController';

function setupApp(
  geocode: (cityName: string) => Promise<GeocodingResult>,
  getForecast: (latitude: number, longitude: number) => Promise<ForecastResult>,
) {
  document.body.innerHTML = `
    <form id="form">
      <label for="city">City</label>
      <input id="city" maxlength="100" />
      <button type="submit">Buscar</button>
      <p id="validation" role="alert" hidden></p>
    </form>
    <p id="loading" role="status" hidden></p>
    <p id="error" role="alert" hidden></p>
    <section id="display" hidden></section>
  `;

  const form = document.querySelector<HTMLFormElement>('#form');
  const input = document.querySelector<HTMLInputElement>('#city');
  const validation = document.querySelector<HTMLElement>('#validation');
  const loading = document.querySelector<HTMLElement>('#loading');
  const error = document.querySelector<HTMLElement>('#error');
  const display = document.querySelector<HTMLElement>('#display');
  const button = form?.querySelector<HTMLButtonElement>('button');
  if (!form || !input || !validation || !loading || !error || !display || !button) {
    throw new Error('Test app elements not initialized');
  }

  const controller = new WeatherController(
    { geocode },
    { getForecast },
    new WeatherDisplay(display),
    new LoadingIndicator(loading),
    new ErrorMessage(error),
    input,
  );
  let searchPromise: Promise<void> | undefined;
  new CitySearchForm(form, input, validation, (cityName) => {
    searchPromise = controller.search(cityName);
  });

  return {
    input,
    loading,
    error,
    display,
    submit: async (cityName: string) => {
      input.value = cityName;
      fireEvent.click(button);
      await searchPromise;
    },
  };
}

describe('weather app integration', () => {
  it('searches a city and renders the current weather in the page', async () => {
    const geocode = vi.fn(async () => ({
      success: true as const,
      data: { latitude: 40.4, longitude: -3.7, cityName: 'Madrid' },
    }));
    const getForecast = vi.fn(async () => ({
      success: true as const,
      data: { temperature: 24.3, humidity: 42, precipitation: 0 },
    }));
    const { submit, display, error, loading } = setupApp(geocode, getForecast);

    await submit('  Madrid  ');

    expect(geocode).toHaveBeenCalledWith('Madrid');
    expect(getForecast).toHaveBeenCalledWith(40.4, -3.7);
    expect(display.textContent).toContain('Madrid');
    expect(display.textContent).toContain('24.3 °C');
    expect(display.textContent).toContain('42 %');
    expect(display.textContent).toContain('0.0 mm');
    expect(display.hidden).toBe(false);
    expect(error.hidden).toBe(true);
    expect(loading.hidden).toBe(true);
  });

  it('shows a geocoding error without disabling the search field', async () => {
    const { submit, input, error } = setupApp(
      async () => ({ success: false, error: { type: 'CITY_NOT_FOUND' } }),
      async () => {
        throw new Error('Forecast must not be requested');
      },
    );

    await submit('Unknown place');

    expect(error.textContent).toContain('No se encontró la ciudad');
    expect(error.hidden).toBe(false);
    expect(input.disabled).toBe(false);
    expect(document.activeElement).toBe(input);
  });
});
