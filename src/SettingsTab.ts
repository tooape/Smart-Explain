import { App, PluginSettingTab, Setting } from 'obsidian';
import type LiveExplainPlugin from './main';

export interface LiveExplainSettings {
  apiKey: string;
}

export const DEFAULT_SETTINGS: LiveExplainSettings = {
  apiKey: '',
};

export class LiveExplainSettingsTab extends PluginSettingTab {
  plugin: LiveExplainPlugin;

  constructor(app: App, plugin: LiveExplainPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Live Explain Settings' });

    new Setting(containerEl)
      .setName('Gemini API Key')
      .setDesc('Enter your Google Gemini API key. Get one at https://aistudio.google.com/apikey')
      .addText(text => text
        .setPlaceholder('Enter your API key')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
