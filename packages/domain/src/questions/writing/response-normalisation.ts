/**
 * Response normalisation for writing tasks.
 */
export interface NormalisationConfig {
  trimWhitespace: boolean;
  normaliseUnicode: boolean;
  collapseMultipleSpaces: boolean;
}

export function normaliseText(text: string, config: NormalisationConfig): string {
  let result = text;
  if (config.normaliseUnicode) {
    result = result.normalize('NFC');
  }
  if (config.collapseMultipleSpaces) {
    result = result.replace(/\s+/g, ' ');
  }
  if (config.trimWhitespace) {
    result = result.trim();
  }
  return result;
}
