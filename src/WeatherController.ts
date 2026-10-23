import { ErrorMessage } from './components/ErrorMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { WeatherDisplay } from './components/WeatherDisplay';
import type {
  ForecastResult,
  GeocodingResult,
  AppState,
} from './types';

interface GeocodingServiceLike {
  geocode(cityName: string): Promise<GeocodingResult>;
}

interface ForecastServiceLike {
  getForecast(latitude: number, longitude: number): Promise<ForecastResult>;
}

export class WeatherController {
  private requestId = 0;
  private currentState: AppState = { status: 'idle' };

  constructor(
    private readonly geocodingService: GeocodingServiceLike,
    private readonly forecastService: ForecastServiceLike,
    private readonly weatherDisplay: WeatherDisplay,
    private readonly loadingIndicator: LoadingIndicator,
    private readonly errorMessage: ErrorMessage,
    private readonly cityInput: HTMLInputElement,
  ) {}

  get state(): AppState {
    return this.currentState;
  }

  async search(cityName: string): Promise<void> {
    const normalizedCityName = cityName.trim();
    if (!normalizedCityName) {
      this.errorMessage.show('El nombre de la ciudad es obligatorio.');
      this.currentState = {
        status: 'error',
        message: 'El nombre de la ciudad es obligatorio.',
      };
      this.cityInput.focus();
      return;
    }

    const requestId = ++this.requestId;
    this.currentState = { status: 'loading' };
    this.weatherDisplay.clear();
    this.errorMessage.clear();
    this.loadingIndicator.show();

    try {
      const geocoding = await this.geocodingService.geocode(normalizedCityName);
      if (requestId !== this.requestId) return;
      if (!geocoding.success) {
        this.showError(geocoding.error, 'geocoding');
        return;
      }

      const forecast = await this.forecastService.getForecast(
        geocoding.data.latitude,
        geocoding.data.longitude,
      );
      if (requestId !== this.requestId) return;
      if (!forecast.success) {
        this.showError(forecast.error, 'forecast');
        return;
      }

      const cityNameFromApi = geocoding.data.cityName;
      const displayCityName = cityNameFromApi.trim()
        ? cityNameFromApi
        : normalizedCityName;
      this.weatherDisplay.render(displayCityName, normalizedCityName, forecast.data);
      this.currentState = {
        status: 'success',
        cityName: displayCityName,
        weather: forecast.data,
      };
    } catch (error) {
      if (requestId !== this.requestId) return;
      console.error('Unexpected error while retrieving weather data.', error);
      const message = 'Ocurrió un error inesperado al consultar el clima.';
      this.errorMessage.show(message);
      this.cityInput.focus();
      this.currentState = { status: 'error', message };
    } finally {
      if (requestId === this.requestId) {
        this.loadingIndicator.hide();
      }
    }
  }

  private showError(
    error: Exclude<GeocodingResult | ForecastResult, { success: true }>['error'],
    service: 'geocoding' | 'forecast',
  ): void {
    const messages: Record<typeof error.type, string> = {
      CITY_NOT_FOUND:
        'No se encontró la ciudad ingresada. Verifica el nombre e intenta de nuevo.',
      NETWORK_ERROR: `El servicio de ${service === 'geocoding' ? 'geocodificación' : 'pronóstico'} no está disponible. Verifica tu conexión.`,
      TIMEOUT: `El servicio de ${service === 'geocoding' ? 'geocodificación' : 'pronóstico'} no respondió a tiempo.`,
      SERVICE_ERROR: `El servicio de ${service === 'geocoding' ? 'geocodificación' : 'pronóstico'} retornó un error.`,
      INVALID_RESPONSE:
        service === 'geocoding'
          ? 'Los datos recibidos del servicio de geocodificación no son válidos.'
          : 'Los datos recibidos del servicio de pronóstico no son válidos.',
      INCOMPLETE_DATA: 'Los datos meteorológicos recibidos están incompletos.',
    };
    const message = messages[error.type];
    this.errorMessage.show(message);
    this.cityInput.focus();
    this.currentState = { status: 'error', message };
  }
}
