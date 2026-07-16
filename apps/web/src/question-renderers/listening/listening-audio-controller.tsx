'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

export type AudioState = 'preload' | 'ready' | 'playing' | 'paused' | 'ended' | 'failed';

export interface ListeningAudioControllerProps {
  playbackGrant: string | null;
  isPlaybackAllowed: boolean;
  maxPlays?: number;
  onPlaybackComplete?: () => void;
  onPlaybackFailed?: (error: Error) => void;
  children: (state: AudioState, audioRef: React.RefObject<HTMLAudioElement | null>) => React.ReactNode;
}

export function ListeningAudioController({
  playbackGrant,
  isPlaybackAllowed,
  maxPlays = 1,
  onPlaybackComplete,
  onPlaybackFailed,
  children,
}: ListeningAudioControllerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>('preload');
  const [playCount, setPlayCount] = useState(0);
  const playsRemaining = maxPlays - playCount;

  useEffect(() => {
    if (!playbackGrant || !isPlaybackAllowed) {
      setState('preload');
      return;
    }
    setState('ready');
  }, [playbackGrant, isPlaybackAllowed]);

  const handlePlay = useCallback(() => {
    if (!audioRef.current || !isPlaybackAllowed || playsRemaining <= 0) return;
    audioRef.current
      .play()
      .then(() => {
        setState('playing');
        setPlayCount((c) => c + 1);
      })
      .catch((err) => {
        setState('failed');
        onPlaybackFailed?.(err instanceof Error ? err : new Error(String(err)));
      });
  }, [isPlaybackAllowed, playsRemaining, onPlaybackFailed]);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
    setState('paused');
  }, []);

  const handleResume = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.play().catch(() => setState('failed'));
    setState('playing');
  }, []);

  const handleReplay = useCallback(() => {
    if (!audioRef.current || playsRemaining <= 0) return;
    audioRef.current.currentTime = 0;
    handlePlay();
  }, [handlePlay, playsRemaining]);

  const handleEnded = useCallback(() => {
    setState('ended');
    onPlaybackComplete?.();
  }, [onPlaybackComplete]);

  const handleError = useCallback(() => {
    setState('failed');
    onPlaybackFailed?.(new Error('Audio playback error'));
  }, [onPlaybackFailed]);

  const canPlay = playsRemaining > 0 && isPlaybackAllowed;
  const playDisabled = !canPlay || state === 'playing' || state === 'preload';

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
          disabled={playDisabled}
          aria-label="Play audio"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          Play ({playsRemaining} remaining)
        </button>
      )}
      {state === 'playing' && (
        <>
          <button
            type="button"
            onClick={handlePause}
            aria-label="Pause audio"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            Pause
          </button>
          <button
            type="button"
            onClick={handleReplay}
            disabled={playDisabled}
            aria-label="Replay audio"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            Replay ({playsRemaining} remaining)
          </button>
        </>
      )}
      {state === 'paused' && (
        <button
          type="button"
          onClick={handleResume}
          aria-label="Resume audio"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          Resume
        </button>
      )}
      {state === 'ended' && (
        <button
          type="button"
          onClick={handleReplay}
          disabled={playDisabled}
          aria-label="Replay audio"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          {playsRemaining > 0 ? `Replay (${playsRemaining} remaining)` : 'Max plays reached'}
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
