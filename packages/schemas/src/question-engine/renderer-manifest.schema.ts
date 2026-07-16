import { z } from 'zod';

export const QuestionRendererCapabilitiesSchema = z.object({
  supportsReview: z.boolean(),
  supportsPlayback: z.boolean(),
  supportsAutosave: z.boolean(),
  supportsKeyboard: z.boolean(),
  supportsTouchInteraction: z.boolean(),
  supportsScreenReader: z.boolean(),
  supportsReducedMotion: z.boolean(),
});

export const RendererAccessibilityContractSchema = z.object({
  keyboardOperable: z.boolean(),
  screenReaderAnnouncements: z.boolean(),
  visibleFocusStates: z.boolean(),
  nonColourOnlyStatus: z.boolean(),
  reducedMotionCompatible: z.boolean(),
  touchCompatibleControls: z.boolean(),
});

export const QuestionRendererManifestSchema = z.object({
  type: z.string(),
  contractVersion: z.string(),
  questionSchemaVersion: z.string(),
  responseSchemaVersion: z.string(),
  capabilities: QuestionRendererCapabilitiesSchema,
  accessibility: RendererAccessibilityContractSchema,
});
