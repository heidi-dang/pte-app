'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MicrophoneCheck } from './microphone-check.js';
import { PreparationCountdown } from './preparation-countdown.js';
import { RecordingStatus } from './recording-status.js';
import { RecordingWaveform } from './recording-waveform.js';
import { UploadProgress } from './upload-progress.js';
import { RecordingRecovery } from './recording-recovery.js';

interface SpeakingRecorderProps {
  preparationSeconds: number;
  maxDurationSeconds: number;
  autoStartRecording: boolean;
  onComplete: (recordingId: string) => void;
}

export function SpeakingRecorder({
  preparationSeconds,
  maxDurationSeconds,
  autoStartRecording,
  onComplete,
}: SpeakingRecorderProps) {
  const [phase, setPhase] = useState<'mic-check' | 'preparing' | 'recording' | 'uploading' | 'done' | 'error'>(
    'mic-check',
  );
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPhase('uploading');
    setTotalChunks(chunksRef.current.length);
    setUploadedChunks(chunksRef.current.length);
    setTimeout(() => {
      onComplete('rec_' + Date.now());
    }, 100);
  }, [onComplete]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start();
      setPhase('recording');
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d >= maxDurationSeconds - 1) {
            stopRecording();
            return maxDurationSeconds;
          }
          return d + 1;
        });
      }, 1000);
    } catch {
      setError('Failed to access microphone');
      setPhase('error');
    }
  }, [maxDurationSeconds, stopRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (phase === 'mic-check') {
    return (
      <MicrophoneCheck
        onReady={() => setPhase('preparing')}
        onError={(msg) => {
          setError(msg);
          setPhase('error');
        }}
      />
    );
  }

  if (phase === 'preparing') {
    return (
      <PreparationCountdown seconds={preparationSeconds} autoStart={autoStartRecording} onComplete={startRecording} />
    );
  }

  if (phase === 'error') {
    return (
      <RecordingRecovery
        recordingState={error ?? 'unknown'}
        onRetry={() => {
          setError(null);
          setPhase('mic-check');
        }}
        onAbandon={() => {
          setError(null);
          setPhase('mic-check');
        }}
      />
    );
  }

  if (phase === 'uploading') {
    return <UploadProgress uploadedChunks={uploadedChunks} totalChunks={totalChunks} />;
  }

  return (
    <div>
      <RecordingStatus state={phase} duration={duration} maxDuration={maxDurationSeconds} />
      <RecordingWaveform />
      <button onClick={stopRecording} type="button">
        Stop
      </button>
    </div>
  );
}
