export class ErrorMessage {
  constructor(private readonly element: HTMLElement) {}

  show(message: string): void {
    this.element.textContent = message;
    this.element.hidden = false;
  }

  clear(): void {
    this.element.textContent = '';
    this.element.hidden = true;
  }
}
