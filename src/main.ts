import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import { ExplainModal } from './ExplainModal';
import { GeminiClient } from './GeminiClient';
import { extractContext } from './ContextExtractor';
import { SmartExplainSettings, DEFAULT_SETTINGS, SmartExplainSettingsTab } from './SettingsTab';

export default class SmartExplainPlugin extends Plugin {
  settings: SmartExplainSettings;

  async onload() {
    await this.loadSettings();

    // Add settings tab
    this.addSettingTab(new SmartExplainSettingsTab(this.app, this));

    // Register context menu item
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        const selection = editor.getSelection();
        if (selection && selection.trim().length > 0) {
          menu.addItem((item) => {
            item
              .setTitle('Smart Explain')
              .setIcon('lightbulb')
              .onClick(() => this.explainSelection(editor, view));
          });
        }
      })
    );

    // Also add a command for keyboard shortcut
    this.addCommand({
      id: 'smart-explain-selection',
      name: 'Smart Explain Selection',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        if (editor.getSelection()?.trim()) {
          this.explainSelection(editor, view);
        } else {
          new Notice('Please select some text first');
        }
      },
    });
  }

  async explainSelection(editor: Editor, view: MarkdownView) {
    // Check for API key
    if (!this.settings.apiKey) {
      new Notice('Please set your Gemini API key in Smart Explain settings');
      return;
    }

    // Get selection coordinates for modal positioning
    const coords = this.getSelectionCoords(view);

    // Extract context
    const context = extractContext(editor, view);

    // Capture selection info before modal opens (cursor may move)
    const selectedText = editor.getSelection();
    const selectionEnd = editor.getCursor('to');

    // Create and show modal with loading state
    const modal = new ExplainModal(this.app, coords, editor, view, selectedText, this.settings.apiKey, selectionEnd);
    modal.open();

    try {
      const client = new GeminiClient(this.settings.apiKey);

      // Start streaming - shows empty content area ready for chunks
      modal.startStreaming();

      // Stream chunks from Gemini
      for await (const chunk of client.explainStream(context)) {
        modal.appendChunk(chunk);
      }

      modal.finishStreaming();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      modal.setError(message);
    }
  }

  private getSelectionCoords(view: MarkdownView): { x: number; y: number } {
    // Try to get coordinates from the editor's selection
    const editor = view.editor;
    const cursor = editor.getCursor('to');

    // Get the editor's DOM element
    const editorEl = (view as any).contentEl as HTMLElement;
    if (!editorEl) {
      return { x: 100, y: 100 };
    }

    // Try to find the CodeMirror selection element
    const cmContent = editorEl.querySelector('.cm-content');
    if (cmContent) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        return {
          x: rect.left,
          y: rect.bottom,
        };
      }
    }

    // Fallback: calculate approximate position from line number
    const lineEl = editorEl.querySelector('.cm-line');
    if (lineEl) {
      const rect = lineEl.getBoundingClientRect();
      const lineHeight = rect.height || 20;
      return {
        x: rect.left + 50,
        y: rect.top + (cursor.line * lineHeight) + lineHeight,
      };
    }

    // Final fallback
    return { x: 200, y: 200 };
  }

  onunload() {
    // Cleanup if needed
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
