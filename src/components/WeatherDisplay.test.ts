import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { WeatherData } from '../types';
import {
  formatHumidity,
  formatPrecipitation,
  formatTemperature,
} from '../utils/formatters';
import { WeatherDisplay } from './WeatherDisplay';

describe('WeatherDisplay', () => {
  it('Property 12: displays each weather value with its unit and city', () => {
    const finiteNumber = fc.double({ noNaN: true, noDefaultInfinity: true });
    fc.assert(
      fc.property(
        fc.string(),
        fc.record({
          temperature: finiteNumber,
          humidity: finiteNumber,
          precipitation: finiteNumber,
        }),
        (cityName, weather: WeatherData) => {
          document.body.innerHTML = '<section id="display" hidden></section>';
          const container = document.querySelector<HTMLElement>('#display');
          if (!container) throw new Error('Display container not initialized');
          const display = new WeatherDisplay(container);
          display.render(cityName, 'Fallback', weather);

          expect(container.hidden).toBe(false);
          expect(container.querySelector('.weather-city')?.textContent).toBe(
            cityName.trim() ? cityName : 'Fallback',
          );
          expect(container.textContent).toContain(formatTemperature(weather.temperature));
          expect(container.textContent).toContain(formatHumidity(weather.humidity));
          expect(container.textContent).toContain(
            formatPrecipitation(weather.precipitation),
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('uses the entered city if the API does not provide a name and can clear results', () => {
    document.body.innerHTML = '<section id="display" hidden></section>';
    const container = document.querySelector<HTMLElement>('#display');
    if (!container) throw new Error('Display container not initialized');
    const display = new WeatherDisplay(container);
    display.render('', 'Entered city', { temperature: 15, humidity: 50, precipitation: 0 });
    expect(container.querySelector('.weather-city')?.textContent).toBe('Entered city');

    display.clear();
    expect(container.hidden).toBe(true);
    expect(container.textContent).toBe('');
  });

  it('preserves the city name exactly as returned by geocoding', () => {
    document.body.innerHTML = '<section id="display" hidden></section>';
    const container = document.querySelector<HTMLElement>('#display');
    if (!container) throw new Error('Display container not initialized');
    const display = new WeatherDisplay(container);
    display.render('  City from API  ', 'Entered city', {
      temperature: 15,
      humidity: 50,
      precipitation: 0,
    });
    expect(container.querySelector('.weather-city')?.textContent).toBe('  City from API  ');
  });
});
