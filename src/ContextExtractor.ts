import { Editor, MarkdownView } from 'obsidian';

export interface ExplainContext {
  selectedText: string;
  surroundingChunk: string;
  headingPath: string[];
  noteTitle: string;
}

export function extractContext(editor: Editor, view: MarkdownView): ExplainContext {
  const selectedText = editor.getSelection();
  const content = editor.getValue();
  const cursor = editor.getCursor('from');

  // Get note title
  const noteTitle = view.file?.basename || 'Untitled';

  // Get surrounding context (~100 chars before and after selection)
  const cursorOffset = editor.posToOffset(cursor);
  const selectionEnd = editor.posToOffset(editor.getCursor('to'));

  const chunkStart = Math.max(0, cursorOffset - 100);
  const chunkEnd = Math.min(content.length, selectionEnd + 100);
  const surroundingChunk = content.slice(chunkStart, chunkEnd);

  // Extract heading path
  const headingPath = extractHeadingPath(content, cursor.line);

  return {
    selectedText,
    surroundingChunk,
    headingPath,
    noteTitle,
  };
}

export function extractHeadingPath(content: string, cursorLine: number): string[] {
  const lines = content.split('\n');
  const headingStack: { level: number; title: string }[] = [];

  for (let i = 0; i <= cursorLine && i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{1,6})\s+(.+)$/);

    if (match) {
      const level = match[1].length;
      const title = match[2].trim();

      // Remove headings at same or deeper level
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }

      headingStack.push({ level, title });
    }
  }

  return headingStack.map(h => h.title);
}
