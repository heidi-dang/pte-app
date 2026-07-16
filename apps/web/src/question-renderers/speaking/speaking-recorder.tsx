'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { RecordingProfile } from '@pte-app/contracts';
import { MicrophoneCheck } from './microphone-check.js';
import { PreparationCountdown } from './preparation-countdown.js';
import { RecordingStatus } from './recording-status.js';
import { RecordingWaveform } from './recording-waveform.js';
import { UploadProgress } from './upload-progress.js';
import { RecordingRecovery } from './recording-recovery.js';
import { RecordingMetadata } from './recording-metadata.js';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');

async function apiPost(path: string, body: unknown, signal?: AbortSignal): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    signal,
  });
  return res.json();
}

async function apiGet(path: string): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
  });
  return res.json();
}

interface SpeakingRecorderProps {
  recordingProfile: RecordingProfile;
  onComplete: (recordingId: string) => void;
  attemptId?: string;
}

export function SpeakingRecorder({ recordingProfile, onComplete, attemptId }: SpeakingRecorderProps) {
  const { preparationPolicy, recordingPolicy } = recordingProfile;
  const [phase, setPhase] = useState<'mic-check' | 'preparing' | 'recording' | 'uploading' | 'done' | 'error'>(
    'mic-check',
  );
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [, setRecordingIdState] = useState<string | null>(null);
  const [, setUploadSessionIdState] = useState<string | null>(null);
  const [recordingMeta, setRecordingMeta] = useState<{ state: string; durationMs: number | null } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingIdRef = useRef<string | null>(null);

  const maxDurationSeconds = recordingPolicy.maxDurationSeconds;

  const uploadChunks = useCallback(async (chunks: Blob[], rId: string, sessionId: string) => {
    const chunkSizeBytes = recordingProfile.uploadPolicy.chunkSizeBytes || 65536;
    const total = Math.ceil(chunks.reduce((acc, c) => acc + c.size, 0) / chunkSizeBytes);
    setTotalChunks(total);
    setUploadedChunks(0);

    let byteOffset = 0;
    let chunkIndex = 0;
    const allData = new Blob(chunks);

    for (let i = 0; i < total; i++) {
      const end = Math.min(byteOffset + chunkSizeBytes, allData.size);
      const chunkBlob = allData.slice(byteOffset, end);
      const buffer = await chunkBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      const res = await apiPost('/api/v1/speaking/upload/chunk', {
        uploadSessionId: sessionId,
        sequenceNumber: i,
        byteCount: chunkBlob.size,
        data: base64,
      });

      if (res.error) {
        setError(res.error);
        setPhase('error');
        return;
      }

      byteOffset = end;
      chunkIndex++;
      setUploadedChunks(chunkIndex);
    }

    const finalRes = await apiPost('/api/v1/speaking/upload/finalize', {
      recordingId: rId,
      durationMs: duration * 1000,
    });

    if (finalRes.error) {
      setError(finalRes.error);
      setPhase('error');
      return;
    }

    const meta = await apiGet(`/api/v1/speaking/recording/${rId}/status`);
    if (meta && !meta.error) {
      setRecordingMeta({
        state: meta.recording?.state ?? 'finalized',
        durationMs: meta.recording?.duration_ms ?? null,
      });
    }

    setPhase('done');
    onComplete(rId);
  }, [duration, onComplete, recordingProfile.uploadPolicy.chunkSizeBytes]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());

    const rId = recordingIdRef.current;
    if (!rId) {
      onComplete('rec_' + Date.now());
      return;
    }

    setPhase('uploading');
    const chunks = chunksRef.current;
    if (chunks.length === 0) {
      onComplete(rId);
      return;
    }

    const startUpload = async () => {
      const totalBytes = chunks.reduce((acc, c) => acc + c.size, 0);
      const chunkSizeBytes = recordingProfile.uploadPolicy.chunkSizeBytes || 65536;
      const totalChunksCount = Math.ceil(totalBytes / chunkSizeBytes);

      const uploadRes = await apiPost('/api/v1/speaking/upload/start', {
        recordingId: rId,
        totalChunks: totalChunksCount,
      });

      if (uploadRes.error) {
        setError(uploadRes.error);
        setPhase('error');
        return;
      }

      setUploadSessionIdState(uploadRes.uploadSession.id);
      await uploadChunks(chunks, rId, uploadRes.uploadSession.id);
    };

    startUpload().catch((e) => {
      setError(e.message);
      setPhase('error');
    });
  }, [onComplete, uploadChunks, recordingProfile.uploadPolicy.chunkSizeBytes]);

  const startBackendRecording = useCallback(async () => {
    if (!attemptId) {
      return 'rec_' + Date.now();
    }
    const res = await apiPost('/api/v1/speaking/recording/start', {
      attemptId,
      recordingProfileId: recordingProfile.id,
    });
    if (res.error) throw new Error(res.error);
    return res.recording.id;
  }, [attemptId, recordingProfile.id]);

  const startRecording = useCallback(async () => {
    try {
      const rId = await startBackendRecording();
      recordingIdRef.current = rId;
      setRecordingIdState(rId);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
      setPhase('error');
    }
  }, [maxDurationSeconds, startBackendRecording, stopRecording]);

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

  if (phase === 'done') {
    return (
      <RecordingMetadata
        state={recordingMeta?.state ?? 'finalized'}
        durationMs={recordingMeta?.durationMs ?? duration * 1000}
      />
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
