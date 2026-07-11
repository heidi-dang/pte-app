/**
 * Writing task renderers
 *
 * Summarize Written Text, Write Essay, and writing integration.
 */

import type { RendererPlugin } from '../types.js';

export function createWritingRenderers(): RendererPlugin[] {
  return [swtRenderer, essayRenderer];
}

const swtRenderer: RendererPlugin = {
  taskType: 'summarize_written_text',
  render: async (prompt) => ({
    blocks: [
      { type: 'text', id: 'passage', data: { text: prompt.passage || '' } },
      { type: 'input', id: 'summary', data: { multiline: true, maxLength: 300, wordCount: true } },
    ],
    instructions: 'Summarize the text in one sentence.',
    estimatedSeconds: 600,
  }),
  validateResponse: (r) => !!(r as Record<string, unknown>)?.summary,
  estimatedSeconds: 600,
};

const essayRenderer: RendererPlugin = {
  taskType: 'write_essay',
  render: async (prompt) => ({
    blocks: [
      { type: 'text', id: 'prompt', data: { text: prompt.prompt || '' } },
      { type: 'input', id: 'essay', data: { multiline: true, maxLength: 2000, wordCount: true, minLength: 200 } },
    ],
    instructions: 'Write an essay in response to the prompt. Minimum 200 words.',
    estimatedSeconds: 1200,
  }),
  validateResponse: (r) => {
    const text = (r as Record<string, unknown>)?.essay;
    return typeof text === 'string' && text.trim().length >= 200;
  },
  estimatedSeconds: 1200,
};
