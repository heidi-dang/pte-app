import type { PlaybackRight, PlaybackState } from '@pte-app/contracts';

export interface PlaybackControllerOptions {
  onRequestPlayback: () => Promise<PlaybackRight>;
  onStateChange: (state: PlaybackState) => void;
  onError: (err: unknown) => void;
}

export function createPlaybackController(options: PlaybackControllerOptions) {
  let right: PlaybackRight | null = null;

  return {
    async requestPlayback() {
      try {
        right = await options.onRequestPlayback();
        options.onStateChange(right.state);
        return right;
      } catch (err) {
        options.onError(err);
        throw err;
      }
    },
    onPlaybackEvent(
      event: 'started' | 'completed' | 'failed',
      failureType?: 'before-consumption' | 'after-consumption',
    ) {
      if (!right) return;
      if (event === 'started') {
        right.state = 'started';
        right.consumedPlays += 1;
      } else if (event === 'completed') {
        right.state = 'completed';
      } else if (event === 'failed') {
        right.state = failureType === 'before-consumption' ? 'failed-before-consumption' : 'failed-after-consumption';
      }
      options.onStateChange(right.state);
    },
    getState(): PlaybackState {
      return right ? right.state : 'allowed';
    },
  };
}
