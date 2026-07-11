/**
 * Listening task renderers
 *
 * Implements all 8 PTE Academic Listening task types.
 */

import type { RendererPlugin } from '../types.js';

export function createListeningRenderers(): RendererPlugin[] {
  return [
    sstRenderer,
    listeningMcmaRenderer,
    listeningFibRenderer,
    hcsRenderer,
    listeningMcsaRenderer,
    smwRenderer,
    hiwRenderer,
    wfdRenderer,
  ];
}

const sstRenderer: RendererPlugin = {
  taskType: 'summarize_spoken_text',
  render: async (prompt) => ({
    blocks: [
      { type: 'audio', id: 'lecture', data: { src: prompt.audioSrc || '', maxPlaybackMs: 90000 } },
      { type: 'input', id: 'summary', data: { multiline: true, maxLength: 500 } },
    ],
    instructions: 'Summarize the spoken text in 50-70 words.',
    estimatedSeconds: 600,
  }),
  validateResponse: (r) => !!(r as Record<string, unknown>)?.summary,
  estimatedSeconds: 600,
};

const listeningMcmaRenderer: RendererPlugin = {
  taskType: 'listening_multiple_choice_multiple',
  render: async (prompt) => ({
    blocks: [
      { type: 'audio', id: 'recording', data: { src: prompt.audioSrc, maxPlaybackMs: 45000 } },
      { type: 'options', id: 'choices', data: { options: prompt.options || [], multiple: true } },
    ],
    instructions: 'Choose more than one correct answer.',
    estimatedSeconds: 90,
  }),
  validateResponse: (r) => Array.isArray((r as Record<string, unknown>)?.selected),
  estimatedSeconds: 90,
};

const listeningFibRenderer: RendererPlugin = {
  taskType: 'listening_fill_blanks',
  render: async (prompt) => ({
    blocks: [
      { type: 'audio', id: 'recording', data: { src: prompt.audioSrc, maxPlaybackMs: 45000 } },
      { type: 'text', id: 'transcript', data: { blanks: prompt.blanks || [] } },
    ],
    instructions: 'Fill in the blanks as you listen.',
    estimatedSeconds: 120,
  }),
  validateResponse: (r) => Array.isArray((r as Record<string, unknown>)?.answers),
  estimatedSeconds: 120,
};

const hcsRenderer: RendererPlugin = {
  taskType: 'highlight_correct_summary',
  render: async (prompt) => ({
    blocks: [
      { type: 'audio', id: 'recording', data: { src: prompt.audioSrc, maxPlaybackMs: 45000 } },
      { type: 'options', id: 'summaries', data: { options: prompt.options || [], multiple: false } },
    ],
    instructions: "Choose the summary that best captures the speaker's message.",
    estimatedSeconds: 90,
  }),
  validateResponse: (r) => typeof (r as Record<string, unknown>)?.selected === 'number',
  estimatedSeconds: 90,
};

const listeningMcsaRenderer: RendererPlugin = {
  taskType: 'listening_multiple_choice_single',
  render: async (prompt) => ({
    blocks: [
      { type: 'audio', id: 'recording', data: { src: prompt.audioSrc, maxPlaybackMs: 45000 } },
      { type: 'options', id: 'choices', data: { options: prompt.options || [], multiple: false } },
    ],
    instructions: 'Choose the best answer.',
    estimatedSeconds: 60,
  }),
  validateResponse: (r) => typeof (r as Record<string, unknown>)?.selected === 'number',
  estimatedSeconds: 60,
};

const smwRenderer: RendererPlugin = {
  taskType: 'select_missing_word',
  render: async (prompt) => ({
    blocks: [
      { type: 'audio', id: 'recording', data: { src: prompt.audioSrc, maxPlaybackMs: 30000 } },
      { type: 'options', id: 'choices', data: { options: prompt.options || [], multiple: false } },
    ],
    instructions: 'Select the missing word at the end of the recording.',
    estimatedSeconds: 30,
  }),
  validateResponse: (r) => typeof (r as Record<string, unknown>)?.selected === 'number',
  estimatedSeconds: 30,
};

const hiwRenderer: RendererPlugin = {
  taskType: 'highlight_incorrect_words',
  render: async (prompt) => ({
    blocks: [
      { type: 'audio', id: 'recording', data: { src: prompt.audioSrc, maxPlaybackMs: 45000 } },
      { type: 'text', id: 'transcript', data: { words: prompt.words || [], highlightable: true } },
    ],
    instructions: 'Click on the words that differ from the recording.',
    estimatedSeconds: 90,
  }),
  validateResponse: (r) => Array.isArray((r as Record<string, unknown>)?.selectedWords),
  estimatedSeconds: 90,
};

const wfdRenderer: RendererPlugin = {
  taskType: 'write_from_dictation',
  render: async (prompt) => ({
    blocks: [
      { type: 'audio', id: 'recording', data: { src: prompt.audioSrc, maxPlaybackMs: 45000 } },
      { type: 'input', id: 'dictation', data: { multiline: false } },
    ],
    instructions: 'Type what you hear.',
    estimatedSeconds: 60,
  }),
  validateResponse: (r) => typeof (r as Record<string, unknown>)?.dictation === 'string',
  estimatedSeconds: 60,
};
