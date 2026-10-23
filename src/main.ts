import './styles.css';
import { CitySearchForm } from './components/CitySearchForm';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { WeatherDisplay } from './components/WeatherDisplay';
import { ForecastService } from './services/ForecastService';
import { GeocodingService } from './services/GeocodingService';
import { WeatherController } from './WeatherController';

function getElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Required app element not found: ${selector}`);
  }
  return element;
}

const cityInput = getElement<HTMLInputElement>('#city-input');
const controller = new WeatherController(
  new GeocodingService(),
  new ForecastService(),
  new WeatherDisplay(getElement('#weather-display')),
  new LoadingIndicator(getElement('#loading-indicator')),
  new ErrorMessage(getElement('#error-message')),
  cityInput,
);

new CitySearchForm(
  getElement<HTMLFormElement>('#city-search-form'),
  cityInput,
  getElement('#search-error'),
  (cityName) => void controller.search(cityName),
);
