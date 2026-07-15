'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

export type AudioState = 'preload' | 'ready' | 'playing' | 'paused' | 'ended' | 'failed';

export interface ListeningAudioControllerProps {
  /** Server playback grant URL or token. */
  playbackGrant: string | null;
  /** Whether playback is allowed by the server. */
  isPlaybackAllowed: boolean;
  /** Callback when playback completes. */
  onPlaybackComplete?: () => void;
  /** Callback on playback failure. */
  onPlaybackFailed?: (error: Error) => void;
  /** Children to render with audio context. */
  children: (state: AudioState, audioRef: React.RefObject<HTMLAudioElement | null>) => React.ReactNode;
}

/**
 * Listening Audio Controller provides audio playback state management.
 * - Visible preload state
 * - Visible ready state
 * - Visible playing state
 * - Failure state
 * - Response retained after player failure
 * - Server playback grant required before playback
 * - No client-side playback-right reset
 */
export function ListeningAudioController({
  playbackGrant,
  isPlaybackAllowed,
  onPlaybackComplete,
  onPlaybackFailed,
  children,
}: ListeningAudioControllerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>('preload');

  useEffect(() => {
    if (!playbackGrant || !isPlaybackAllowed) {
      setState('preload');
      return;
    }
    setState('ready');
  }, [playbackGrant, isPlaybackAllowed]);

  const handlePlay = useCallback(() => {
    if (!audioRef.current || !isPlaybackAllowed) return;
    audioRef.current
      .play()
      .then(() => {
        setState('playing');
      })
      .catch((err) => {
        setState('failed');
        onPlaybackFailed?.(err instanceof Error ? err : new Error(String(err)));
      });
  }, [isPlaybackAllowed, onPlaybackFailed]);

  const handleEnded = useCallback(() => {
    setState('ended');
    onPlaybackComplete?.();
  }, [onPlaybackComplete]);

  const handleError = useCallback(() => {
    setState('failed');
    onPlaybackFailed?.(new Error('Audio playback error'));
  }, [onPlaybackFailed]);

  return (
    <div role="region" aria-label="Audio playback">
      {playbackGrant && isPlaybackAllowed && (
        <audio
          ref={audioRef}
          src={playbackGrant}
          onPlay={() => setState('playing')}
          onPause={() => setState('paused')}
          onEnded={handleEnded}
          onError={handleError}
          preload="auto"
        />
      )}
      {state === 'preload' && (
        <div className="audio-status" role="status" aria-label="Audio loading">
          Loading audio...
        </div>
      )}
      {state === 'ready' && (
        <button
          type="button"
          onClick={handlePlay}
          aria-label="Play audio"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          Play
        </button>
      )}
      {state === 'failed' && (
        <div className="audio-status audio-failed" role="alert" aria-label="Audio playback failed">
          Audio playback failed. Your response has been saved.
        </div>
      )}
      {children(state, audioRef)}
    </div>
  );
}

export interface ListeningAudioStatusProps {
  state: AudioState;
}

export function ListeningAudioStatus({ state }: ListeningAudioStatusProps) {
  const labels: Record<AudioState, string> = {
    preload: 'Audio loading',
    ready: 'Audio ready to play',
    playing: 'Audio playing',
    paused: 'Audio paused',
    ended: 'Audio playback ended',
    failed: 'Audio playback failed',
  };
  return (
    <div className="audio-status" role="status" aria-label={labels[state]}>
      {labels[state]}
    </div>
  );
}
