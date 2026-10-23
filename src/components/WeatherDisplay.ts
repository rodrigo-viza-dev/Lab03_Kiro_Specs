import type { WeatherData } from '../types';
import {
  formatHumidity,
  formatPrecipitation,
  formatTemperature,
} from '../utils/formatters';

export class WeatherDisplay {
  constructor(private readonly container: HTMLElement) {}

  render(cityName: string, fallbackCityName: string, weather: WeatherData): void {
    const city = document.createElement('p');
    city.className = 'weather-city';
    city.textContent = cityName.trim() ? cityName : fallbackCityName;

    const values = document.createElement('dl');
    values.className = 'weather-values';
    values.append(
      this.createValue('Temperatura', formatTemperature(weather.temperature)),
      this.createValue('Humedad', formatHumidity(weather.humidity)),
      this.createValue('Precipitación', formatPrecipitation(weather.precipitation)),
    );

    this.container.replaceChildren(city, values);
    this.container.hidden = false;
  }

  clear(): void {
    this.container.replaceChildren();
    this.container.hidden = true;
  }

  private createValue(label: string, value: string): HTMLElement {
    const item = document.createElement('div');
    item.className = 'weather-value';

    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    description.textContent = value;
    item.append(term, description);
    return item;
  }
}
