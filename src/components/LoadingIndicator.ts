export class LoadingIndicator {
  constructor(private readonly element: HTMLElement) {}

  show(): void {
    this.element.hidden = false;
  }

  hide(): void {
    this.element.hidden = true;
  }
}
