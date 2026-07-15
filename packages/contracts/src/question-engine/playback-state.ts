import { PlaybackRightId, PlaybackProfileId } from './identifiers';

export type PlaybackState =
  | 'allowed'
  | 'ready'
  | 'started'
  | 'consumed'
  | 'completed'
  | 'failed-before-consumption'
  | 'failed-after-consumption';

export interface PlaybackRight {
  id: PlaybackRightId;
  playbackProfileId: PlaybackProfileId;
  allowedPlays: number;
  consumedPlays: number;
  state: PlaybackState;
  startedAt?: string;
  consumedAt?: string;
  completedAt?: string;
  failureState?: 'before-consumption' | 'after-consumption';
}
