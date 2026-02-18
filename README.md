# Smart Explain

An [Obsidian](https://obsidian.md) plugin that gives you AI-powered explanations for any selected text. Select a word, phrase, or passage, and Smart Explain opens a popover with a concise, context-aware explanation streamed from Google Gemini.

## Features

- **Context-aware explanations** — sends the note title, heading hierarchy, and surrounding text so the AI understands *what* you're reading, not just the highlighted words
- **Streaming responses** — answers appear token-by-token in a popover positioned right next to your selection
- **Right-click or hotkey** — access via the editor context menu ("Smart Explain") or assign a keyboard shortcut through Obsidian's hotkeys settings
- **Markdown rendering** — responses are rendered as full Obsidian markdown (bold, lists, code blocks, etc.)
- **Click outside to dismiss** — lightweight, non-intrusive UX

## Installation

### Manual

1. Download the latest release (`main.js`, `manifest.json`, `styles.css`) from the [Releases](https://github.com/tooape/Smart-Explain/releases) page.
2. Create a folder called `smart-explain` inside your vault's `.obsidian/plugins/` directory.
3. Copy the three files into that folder.
4. In Obsidian, go to **Settings → Community plugins** and enable **Smart Explain**.

### Build from source

```bash
git clone git@github.com:tooape/Smart-Explain.git
cd Smart-Explain
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` into your vault's `.obsidian/plugins/smart-explain/` directory.

## Setup

1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Open **Settings → Smart Explain** and paste your API key.

## Usage

1. Select any text in a note.
2. Either:
   - **Right-click** and choose **Smart Explain**, or
   - Open the command palette (`Ctrl/Cmd + P`) and run **Smart Explain Selection**
3. A popover appears near your selection with a streamed explanation.
4. Click anywhere outside the popover to dismiss it.

## How It Works

Smart Explain sends more than just your highlighted text to the LLM. It builds a context object that includes:

| Signal | Purpose |
|---|---|
| **Selected text** | The passage to explain |
| **Note title** | Tells the model what document you're in |
| **Heading path** | The full `H1 > H2 > H3` hierarchy above the selection |
| **Surrounding text** | ~100 characters before and after the selection |

This context helps the model produce explanations that are relevant to *your* notes rather than generic definitions.

## Architecture

```
src/
├── main.ts              # Plugin lifecycle, context menu & command registration
├── GeminiClient.ts      # Gemini API wrapper (streaming + non-streaming)
├── ExplainModal.ts      # Positioned popover with live markdown rendering
├── ContextExtractor.ts  # Extracts heading path, surrounding text, note title
└── SettingsTab.ts       # Settings UI for the API key
```

## License

[MIT](https://opensource.org/licenses/MIT)
