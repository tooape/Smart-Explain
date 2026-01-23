import { App, PluginSettingTab, Setting } from 'obsidian';
import type SmartExplainPlugin from './main';

export interface SmartExplainSettings {
  apiKey: string;
}

export const DEFAULT_SETTINGS: SmartExplainSettings = {
  apiKey: '',
};

export class SmartExplainSettingsTab extends PluginSettingTab {
  plugin: SmartExplainPlugin;

  constructor(app: App, plugin: SmartExplainPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Smart Explain Settings' });

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
