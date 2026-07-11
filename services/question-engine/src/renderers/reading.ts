/**
 * Reading task renderers
 *
 * Implements all 5 PTE Academic Reading task types:
 * - Reading & Writing: Fill in the Blanks (RW-FIB)
 * - Multiple Choice, Multiple Answers (MCMA)
 * - Reorder Paragraph (RO)
 * - Reading: Fill in the Blanks (R-FIB)
 * - Multiple Choice, Single Answer (MCSA)
 */

import type { RendererPlugin, RendererOutput } from '../types.js';

export function createReadingRenderers(): RendererPlugin[] {
  return [rwFibRenderer, mcmaRenderer, reorderRenderer, rFibRenderer, mcsaRenderer];
}

const rwFibRenderer: RendererPlugin = {
  taskType: 'reading_fill_blanks',
  render: async (prompt) => ({
    blocks: [
      {
        type: 'text',
        id: 'instruction',
        data: { text: prompt.instruction || 'Fill in the blanks in the text below.' },
      },
      { type: 'text', id: 'passage', data: { html: prompt.passage || '', blanks: prompt.blanks || [] } },
      { type: 'input', id: 'answers', data: { blanks: prompt.blanks || [] } },
    ],
    instructions: 'Fill in each blank by selecting the correct word from the dropdown.',
    estimatedSeconds: 120,
  }),
  validateResponse: (response) => {
    if (!response || typeof response !== 'object') return false;
    const answers = (response as Record<string, unknown>).answers;
    return Array.isArray(answers) && answers.every((a) => typeof a === 'string');
  },
  estimatedSeconds: 120,
};

const mcmaRenderer: RendererPlugin = {
  taskType: 'multiple_choice_multiple',
  render: async (prompt) => ({
    blocks: [
      { type: 'text', id: 'instruction', data: { text: prompt.instruction || 'Choose more than one correct answer.' } },
      { type: 'text', id: 'passage', data: { text: prompt.passage || '' } },
      { type: 'options', id: 'choices', data: { options: prompt.options || [], multiple: true } },
    ],
    instructions: 'Select all that apply.',
    estimatedSeconds: 90,
  }),
  validateResponse: (response) => {
    if (!response || typeof response !== 'object') return false;
    return Array.isArray((response as Record<string, unknown>).selected);
  },
  estimatedSeconds: 90,
};

const reorderRenderer: RendererPlugin = {
  taskType: 'reorder_paragraph',
  render: async (prompt) => ({
    blocks: [
      {
        type: 'text',
        id: 'instruction',
        data: { text: prompt.instruction || 'Put the paragraphs in the correct order.' },
      },
      { type: 'text', id: 'paragraphs', data: { items: prompt.paragraphs || [], shuffle: true } },
    ],
    instructions: 'Drag and drop the paragraphs into the correct sequence.',
    estimatedSeconds: 120,
  }),
  validateResponse: (response) => {
    if (!response || typeof response !== 'object') return false;
    return Array.isArray((response as Record<string, unknown>).order);
  },
  estimatedSeconds: 120,
};

const rFibRenderer: RendererPlugin = {
  taskType: 'reading_fill_blanks_single',
  render: async (prompt) => ({
    blocks: [
      { type: 'text', id: 'instruction', data: { text: prompt.instruction || 'Fill in the blank in the text below.' } },
      { type: 'text', id: 'passage', data: { html: prompt.passage || '', blanks: prompt.blanks || [] } },
      { type: 'options', id: 'word_bank', data: { options: prompt.wordBank || [] } },
    ],
    instructions: 'Drag words from the word bank to fill the blanks.',
    estimatedSeconds: 90,
  }),
  validateResponse: (response) => {
    if (!response || typeof response !== 'object') return false;
    return Array.isArray((response as Record<string, unknown>).answers);
  },
  estimatedSeconds: 90,
};

const mcsaRenderer: RendererPlugin = {
  taskType: 'multiple_choice_single',
  render: async (prompt) => ({
    blocks: [
      { type: 'text', id: 'instruction', data: { text: prompt.instruction || 'Choose the best answer.' } },
      { type: 'text', id: 'passage', data: { text: prompt.passage || '' } },
      { type: 'options', id: 'choices', data: { options: prompt.options || [], multiple: false } },
    ],
    instructions: 'Select the single best answer.',
    estimatedSeconds: 60,
  }),
  validateResponse: (response) => {
    if (!response || typeof response !== 'object') return false;
    return typeof (response as Record<string, unknown>).selected === 'number';
  },
  estimatedSeconds: 60,
};
