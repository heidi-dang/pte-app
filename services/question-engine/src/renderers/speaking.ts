/**
 * Speaking task renderers
 *
 * Read Aloud, Repeat Sentence, Describe Image, Retell Lecture,
 * Answer Short Question, Summarize Group Discussion, Respond to a Situation.
 */

import type { RendererPlugin } from '../types.js';

export function createSpeakingRenderers(): RendererPlugin[] {
  return [raRenderer, rsRenderer, diRenderer, rlRenderer, asqRenderer, sgdRenderer, rtsRenderer];
}

const raRenderer: RendererPlugin = {
  taskType: 'read_aloud',
  render: async (prompt) => ({
    blocks: [
      { type: 'text', id: 'passage', data: { text: prompt.passage || '' } },
      { type: 'recording', id: 'recorder', data: { preparationSec: 30, recordingSec: 40 } },
    ],
    instructions: 'Read the text aloud.',
    estimatedSeconds: 40,
  }),
  validateResponse: (r) => !!(r as Record<string, unknown>)?.recordingId,
  estimatedSeconds: 40,
};

const rsRenderer: RendererPlugin = {
  taskType: 'repeat_sentence',
  render: async (prompt) => ({
    blocks: [
      { type: 'audio', id: 'sentence', data: { src: prompt.audioSrc, maxPlaybackMs: 15000 } },
      { type: 'recording', id: 'recorder', data: { preparationSec: 0, recordingSec: 15 } },
    ],
    instructions: 'Repeat the sentence you hear.',
    estimatedSeconds: 15,
  }),
  validateResponse: (r) => !!(r as Record<string, unknown>)?.recordingId,
  estimatedSeconds: 15,
};

const diRenderer: RendererPlugin = {
  taskType: 'describe_image',
  render: async (prompt) => ({
    blocks: [
      { type: 'image', id: 'image', data: { src: prompt.imageSrc || '' } },
      { type: 'recording', id: 'recorder', data: { preparationSec: 25, recordingSec: 40 } },
    ],
    instructions: 'Describe the image in detail.',
    estimatedSeconds: 40,
  }),
  validateResponse: (r) => !!(r as Record<string, unknown>)?.recordingId,
  estimatedSeconds: 40,
};

const rlRenderer: RendererPlugin = {
  taskType: 'retell_lecture',
  render: async (prompt) => ({
    blocks: [
      { type: 'audio', id: 'lecture', data: { src: prompt.audioSrc, maxPlaybackMs: 90000 } },
      { type: 'recording', id: 'recorder', data: { preparationSec: 10, recordingSec: 40 } },
    ],
    instructions: 'Retell the lecture in your own words.',
    estimatedSeconds: 90,
  }),
  validateResponse: (r) => !!(r as Record<string, unknown>)?.recordingId,
  estimatedSeconds: 90,
};

const asqRenderer: RendererPlugin = {
  taskType: 'answer_short_question',
  render: async (prompt) => ({
    blocks: [
      { type: 'audio', id: 'question', data: { src: prompt.audioSrc, maxPlaybackMs: 10000 } },
      { type: 'recording', id: 'recorder', data: { preparationSec: 0, recordingSec: 10 } },
    ],
    instructions: 'Answer the question with a single word or phrase.',
    estimatedSeconds: 10,
  }),
  validateResponse: (r) => !!(r as Record<string, unknown>)?.recordingId || !!(r as Record<string, unknown>)?.text,
  estimatedSeconds: 10,
};

const sgdRenderer: RendererPlugin = {
  taskType: 'summarize_group_discussion',
  render: async (prompt) => ({
    blocks: [
      { type: 'audio', id: 'discussion', data: { src: prompt.audioSrc, maxPlaybackMs: 90000 } },
      { type: 'recording', id: 'recorder', data: { preparationSec: 10, recordingSec: 60 } },
    ],
    instructions: 'Summarize the group discussion.',
    estimatedSeconds: 90,
  }),
  validateResponse: (r) => !!(r as Record<string, unknown>)?.recordingId,
  estimatedSeconds: 90,
};

const rtsRenderer: RendererPlugin = {
  taskType: 'respond_to_a_situation',
  render: async (prompt) => ({
    blocks: [
      { type: 'text', id: 'situation', data: { text: prompt.situation || '' } },
      { type: 'recording', id: 'recorder', data: { preparationSec: 20, recordingSec: 30 } },
    ],
    instructions: 'Respond to the situation described.',
    estimatedSeconds: 30,
  }),
  validateResponse: (r) => !!(r as Record<string, unknown>)?.recordingId,
  estimatedSeconds: 30,
};
