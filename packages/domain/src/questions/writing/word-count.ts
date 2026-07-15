/**
 * Word count logic — deterministic and tested.
 * Handles whitespace, punctuation, apostrophes, hyphenated terms,
 * line breaks, and Unicode text.
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  const normalised = text
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (normalised.length === 0) return 0;
  return normalised.split(/\s+/).filter((word) => word.length > 0).length;
}

export function countCharacters(text: string): number {
  if (!text) return 0;
  return text.length;
}

export function isComplete(text: string, minWords: number, maxWords: number): boolean {
  const wc = countWords(text);
  return wc >= minWords && wc <= maxWords;
}

export function isEmpty(text: string, emptyThreshold: number): boolean {
  return countWords(text) <= emptyThreshold;
}

export function isIncomplete(text: string, emptyThreshold: number, incompleteThreshold: number): boolean {
  const wc = countWords(text);
  return wc > emptyThreshold && wc < incompleteThreshold;
}
