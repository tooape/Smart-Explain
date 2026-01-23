import { App, Modal, MarkdownRenderer, Component } from 'obsidian';

export class ExplainModal extends Modal {
  private content: string = '';
  private isLoading: boolean = true;
  private error: string | null = null;
  private targetCoords: { x: number; y: number };
  private renderComponent: Component;
  private clickHandler: (e: MouseEvent) => void;

  constructor(app: App, coords: { x: number; y: number }) {
    super(app);
    this.targetCoords = coords;
    this.renderComponent = new Component();

    this.clickHandler = (e: MouseEvent) => {
      // Small delay to avoid closing immediately on the opening click
      setTimeout(() => {
        if (!this.containerEl.contains(e.target as Node)) {
          this.close();
        }
      }, 0);
    };
  }

  onOpen() {
    this.containerEl.addClass('live-explain-modal');
    this.modalEl.addClass('live-explain-modal-inner');

    // Position near the selection
    this.positionModal();

    // Render initial state
    this.render();

    // Register click-outside handler with delay
    setTimeout(() => {
      document.addEventListener('click', this.clickHandler);
    }, 100);

    this.renderComponent.load();
  }

  onClose() {
    document.removeEventListener('click', this.clickHandler);
    this.renderComponent.unload();
    this.contentEl.empty();
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
    this.render();
  }

  setContent(content: string) {
    this.content = content;
    this.isLoading = false;
    this.error = null;
    this.render();
  }

  setError(error: string) {
    this.error = error;
    this.isLoading = false;
    this.render();
  }

  private positionModal() {
    const modalEl = this.modalEl;

    // Remove default centering
    modalEl.style.position = 'fixed';
    modalEl.style.margin = '0';

    // Position below the selection
    let top = this.targetCoords.y + 10;
    let left = this.targetCoords.x;

    // Ensure modal stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const modalWidth = 400; // Approximate width
    const modalHeight = 300; // Approximate max height

    // Adjust horizontal position
    if (left + modalWidth > viewportWidth - 20) {
      left = viewportWidth - modalWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }

    // If not enough space below, show above
    if (top + modalHeight > viewportHeight - 20) {
      top = this.targetCoords.y - modalHeight - 10;
      if (top < 20) {
        top = 20;
      }
    }

    modalEl.style.top = `${top}px`;
    modalEl.style.left = `${left}px`;
    modalEl.style.transform = 'none';
  }

  private render() {
    const { contentEl } = this;
    contentEl.empty();

    if (this.isLoading) {
      const loadingEl = contentEl.createEl('div', { cls: 'live-explain-loading' });
      loadingEl.createEl('div', { cls: 'live-explain-spinner' });
      loadingEl.createEl('span', { text: 'Thinking...' });
      return;
    }

    if (this.error) {
      const errorEl = contentEl.createEl('div', { cls: 'live-explain-error' });
      errorEl.createEl('span', { text: this.error });
      return;
    }

    const contentWrapper = contentEl.createEl('div', { cls: 'live-explain-content' });
    MarkdownRenderer.render(
      this.app,
      this.content,
      contentWrapper,
      '',
      this.renderComponent
    );
  }
}
