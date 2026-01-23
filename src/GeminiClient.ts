import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExplainContext } from './ContextExtractor';

const SYSTEM_PROMPT = `You are a helpful assistant explaining selections of text the user would like more information about within a note editor and personal knowledge base.

GUIDELINES:
- Be concise, but complete in your answers (2-4 paragraphs max)
- Your answer should be only as long as needed to cover the core explanation, do not be overly verbose
- Use simple language unless technical terms are necessary
- If the text references concepts, briefly clarify them
- If the text appears to be jargon or an acronym, define it
- Format response in markdown (bold key terms, use bullet points if helpful)
- Do not repeat the selected text back verbatim
- Do not use language like "this text is about", go directly to the explanation
- Seperate different sections with a blank line`;

export class GeminiClient {
  private ai: GoogleGenerativeAI;
  private model = 'gemini-3-flash-preview';

  constructor(apiKey: string) {
    this.ai = new GoogleGenerativeAI(apiKey);
  }

  async explain(context: ExplainContext): Promise<string> {
    const prompt = this.buildPrompt(context);

    try {
      const model = this.ai.getGenerativeModel({
        model: this.model,
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your Gemini API key in settings.');
        }
        if (error.message.includes('quota') || error.message.includes('rate')) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        throw new Error(`Gemini API error: ${error.message}`);
      }
      throw new Error('An unexpected error occurred while calling Gemini.');
    }
  }

  private buildPrompt(context: ExplainContext): string {
    const headingPath = context.headingPath.length > 0
      ? context.headingPath.join(' > ')
      : 'No heading';

    return `CONTEXT:
- Note title: ${context.noteTitle}
- Section path: ${headingPath}
- Surrounding text: ${context.surroundingChunk}

TASK: Explain the following selected text clearly and concisely.

Selected text: "${context.selectedText}"`;
  }
}
