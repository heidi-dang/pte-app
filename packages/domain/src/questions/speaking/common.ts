export const SPEAKING_MANIFEST_BASE = {
  contractVersion: '1.0.0',
  questionSchemaVersion: '1.0.0',
  responseSchemaVersion: '1.0.0',
  capabilities: {
    supportsReview: false,
    supportsPlayback: false,
    supportsAutosave: false,
    supportsKeyboard: true,
    supportsTouchInteraction: true,
    supportsScreenReader: true,
    supportsReducedMotion: true,
  },
  accessibility: {
    keyboardOperable: true,
    screenReaderAnnouncements: true,
    visibleFocusStates: true,
    nonColourOnlyStatus: true,
    reducedMotionCompatible: true,
    touchCompatibleControls: true,
  },
} as const;
