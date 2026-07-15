import type { SpeakingCommonContract } from './common.js';

/**
 * Speaking: Describe Image
 *
 * Candidate describes an image shown on screen.
 */
export interface DescribeImageQuestion extends SpeakingCommonContract {
  type: 'describe_image';
  /** URL of the image to describe. */
  imageUrl: string;
  /** Server-side description for evaluation reference. */
  imageDescription: string;
  /** Prompt text shown alongside the image. */
  promptText: string;
}

export interface DescribeImageResponse {
  recordingId: string;
}
