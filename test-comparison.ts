/**
 * Compare Gemini models for Live Explain
 * Run with: npx ts-node test-comparison.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';

// Test selection from NLU Autocomplete for Lr.md
const TEST_CONTEXT = {
  noteTitle: 'NLU Autocomplete for Lr',
  headingPath: ['Neural autocomplete replaces frequency counting with semantic understanding'],
  selectedText: `LinkedIn's production system exemplifies this approach. Their Efficient Neural Query Auto Completion( CIKM 2020) uses SuffixFST (Finite State Transducer) for initial candidate generation, then applies a Convolutional Latent Semantic Model for semantic ranking, achieving 95% latency reduction compared to traditional neural language models. Amazon's session-aware system models query auto-completion as an extreme multi-label ranking problem, delivering 33% MRR improvement for short prefixes (≤3 characters) while maintaining sub-10ms inference latency.`,
  surroundingChunk: `Traditional autocomplete systems like Elasticsearch's completion suggester rely on prefix matching and popularity-based ranking—essentially counting how often previous users searched for similar terms. Modern neural approaches fundamentally change this architecture through a two-stage pipeline: candidate generation followed by neural ranking.`,
};

// Prompt variants to test
const PROMPTS = {
  v1_minimal: {
    system: `Explain the selected text concisely. Use markdown. 2-3 short paragraphs max. Go directly to the explanation.`,
    user: (ctx: typeof TEST_CONTEXT) => `Note: ${ctx.noteTitle} > ${ctx.headingPath.join(' > ')}
Context: ${ctx.surroundingChunk.slice(0, 400)}

Explain: "${ctx.selectedText}"`,
  },

  v2_structured: {
    system: `You explain technical text from a knowledge base. Be direct and concise.
Output format: 1-2 paragraphs, max 150 words. Use **bold** for key terms.`,
    user: (ctx: typeof TEST_CONTEXT) => `"${ctx.selectedText}"

From: ${ctx.noteTitle}`,
  },

  v3_terse: {
    system: `Technical explainer. Max 100 words. Bold key terms. No preamble.`,
    user: (ctx: typeof TEST_CONTEXT) => ctx.selectedText,
  },
};

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash-exp'];

async function runTest(
  ai: GoogleGenerativeAI,
  modelName: string,
  promptName: string,
  prompt: { system: string; user: (ctx: typeof TEST_CONTEXT) => string }
) {
  const start = performance.now();

  const model = ai.getGenerativeModel({
    model: modelName,
    systemInstruction: prompt.system,
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.3,
    },
  });

  const result = await model.generateContent(prompt.user(TEST_CONTEXT));
  const latency = Math.round(performance.now() - start);
  const text = result.response.text();
  const wordCount = text.split(/\s+/).length;

  return { latency, text, wordCount };
}

async function main() {
  if (!API_KEY) {
    console.error('Set GEMINI_API_KEY environment variable');
    process.exit(1);
  }

  const ai = new GoogleGenerativeAI(API_KEY);

  console.log('='.repeat(80));
  console.log('LIVE EXPLAIN MODEL COMPARISON');
  console.log('='.repeat(80));
  console.log(`\nSelected text (${TEST_CONTEXT.selectedText.split(/\s+/).length} words):\n`);
  console.log(TEST_CONTEXT.selectedText.slice(0, 200) + '...\n');

  for (const [promptName, prompt] of Object.entries(PROMPTS)) {
    console.log('\n' + '─'.repeat(80));
    console.log(`PROMPT: ${promptName}`);
    console.log(`System: "${prompt.system.slice(0, 60)}..."`);
    console.log('─'.repeat(80));

    for (const modelName of MODELS) {
      try {
        const result = await runTest(ai, modelName, promptName, prompt);
        console.log(`\n### ${modelName} (${result.latency}ms, ${result.wordCount} words)`);
        console.log(result.text);
      } catch (e) {
        console.log(`\n### ${modelName}: ERROR - ${e}`);
      }
    }
  }
}

main();
