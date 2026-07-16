'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { RecordingProfile } from '@pte-app/contracts';
import { MicrophoneCheck } from './microphone-check.js';
import { PreparationCountdown } from './preparation-countdown.js';
import { RecordingStatus } from './recording-status.js';
import { RecordingWaveform } from './recording-waveform.js';
import { UploadProgress } from './upload-progress.js';
import { RecordingRecovery } from './recording-recovery.js';

const API_BASE = '/api/v1/speaking';

interface SpeakingRecorderProps {
  recordingProfile: RecordingProfile;
  onComplete: (recordingId: string) => void;
  attemptId?: string;
  recordingProfileId?: string;
}

export function SpeakingRecorder({
  recordingProfile,
  onComplete,
  attemptId,
  recordingProfileId,
}: SpeakingRecorderProps) {
  const { preparationPolicy, recordingPolicy } = recordingProfile;
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
  const recordingIdRef = useRef<string | null>(null);
  const uploadSessionIdRef = useRef<string | null>(null);
  const shouldStopRef = useRef(false);

  const maxDurationSeconds = recordingPolicy.maxDurationSeconds;

  const uploadChunks = useCallback(async (chunks: Blob[], sessionId: string) => {
    let acknowledged = 0;
    for (let i = 0; i < chunks.length; i++) {
      const blob = chunks[i];
      if (!blob) continue;
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.slice(result.indexOf(',') + 1));
        };
        reader.onerror = () => reject(new Error('Failed to read chunk'));
        reader.readAsDataURL(blob);
      });

      const res = await fetch(`${API_BASE}/upload/chunk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadSessionId: sessionId,
          sequenceNumber: i,
          byteCount: blob.size,
          data: base64,
        }),
      });

      if (!res.ok && res.status !== 409) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error ?? 'Upload failed');
      }
      acknowledged = i + 1;
      setUploadedChunks(acknowledged);
    }
    return acknowledged;
  }, []);

  const stopRecording = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPhase('uploading');

    const chunks = chunksRef.current;
    setTotalChunks(chunks.length);

    try {
      const startRes = await fetch(`${API_BASE}/recording/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, recordingProfileId }),
      });

      if (!startRes.ok) throw new Error('Failed to start recording');
      const startData = await startRes.json();
      recordingIdRef.current = startData.recording.id;

      const uploadRes = await fetch(`${API_BASE}/upload/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordingId: recordingIdRef.current,
          totalChunks: chunks.length,
        }),
      });

      if (!uploadRes.ok) throw new Error('Failed to start upload');
      const uploadData = await uploadRes.json();
      const sessionId = uploadData.uploadSession.id as string;
      uploadSessionIdRef.current = sessionId;

      await uploadChunks(chunks, sessionId);

      await fetch(`${API_BASE}/upload/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordingId: recordingIdRef.current }),
      });

      setPhase('done');
      const rid = recordingIdRef.current;
      if (rid) onComplete(rid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPhase('error');
    }
  }, [onComplete, uploadChunks, attemptId, recordingProfileId]);

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
      mr.start(1000);
      setPhase('recording');
      setDuration(0);
      shouldStopRef.current = false;
      timerRef.current = setInterval(() => {
        setDuration((d) => {
          const next = d + 1;
          if (next >= maxDurationSeconds) {
            shouldStopRef.current = true;
            return maxDurationSeconds;
          }
          return next;
        });
      }, 1000);
    } catch {
      setError('Failed to access microphone');
      setPhase('error');
    }
  }, [maxDurationSeconds]);

  useEffect(() => {
    if (shouldStopRef.current) {
      shouldStopRef.current = false;
      stopRecording();
    }
  }, [duration, stopRecording]);

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
    return <PreparationCountdown profile={preparationPolicy} onComplete={startRecording} />;
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
      <button onClick={stopRecording} type="button" aria-label="Stop recording">
        Stop
      </button>
    </div>
  );
}
