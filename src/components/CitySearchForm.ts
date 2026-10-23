export class CitySearchForm {
  constructor(
    private readonly form: HTMLFormElement,
    private readonly input: HTMLInputElement,
    private readonly validationMessage: HTMLElement,
    private readonly onSearch: (cityName: string) => void,
  ) {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      const cityName = this.input.value.trim();

      if (!cityName) {
        this.showValidationError();
        this.input.focus();
        return;
      }

      this.clearValidationError();
      this.onSearch(cityName);
    });

    this.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.form.requestSubmit();
      }
    });

    this.input.addEventListener('input', () => this.clearValidationError());
  }

  showValidationError(): void {
    this.validationMessage.textContent = 'El nombre de la ciudad es obligatorio.';
    this.validationMessage.hidden = false;
  }

  clearValidationError(): void {
    this.validationMessage.textContent = '';
    this.validationMessage.hidden = true;
  }
}
