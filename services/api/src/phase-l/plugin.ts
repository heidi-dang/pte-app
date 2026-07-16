import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { DatabaseConnection } from '@pte-app/database';
import { phaseL } from '@pte-app/database';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { hasPermission } from '../auth/rbac.js';
import type { UserRole } from '../auth/rbac.js';

const CHUNK_STORAGE_DIR = process.env.CHUNK_STORAGE_DIR ?? join(process.cwd(), '.local-runtime', 'chunks');

function ensureChunkStorage(): void {
  if (!existsSync(CHUNK_STORAGE_DIR)) {
    mkdirSync(CHUNK_STORAGE_DIR, { recursive: true });
  }
}

function storeChunk(key: string, data: Buffer): void {
  ensureChunkStorage();
  writeFileSync(join(CHUNK_STORAGE_DIR, key), data);
}

function getAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.auth) {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }
  return request.auth;
}

const StartRecordingSchema = z.object({
  attemptId: z.string().min(1),
  recordingProfileId: z.string().min(1),
});

const StartUploadSchema = z.object({
  recordingId: z.string().min(1),
  totalChunks: z.number().int().min(1),
});

const ChunkUploadSchema = z.object({
  uploadSessionId: z.string().min(1),
  sequenceNumber: z.number().int().min(0),
  byteCount: z.number().int().min(1),
  data: z.string().min(1),
  checksum: z.string().optional(),
});

const FinalizeSchema = z.object({
  recordingId: z.string().min(1),
  durationMs: z.number().int().min(0).optional(),
});

function formatZodError(error: z.ZodError): string[] {
  return error.errors.map((e) => `'${e.path.join('.')}' ${e.message}`);
}

export async function phaseLPlugin(app: FastifyInstance, options: { db: DatabaseConnection }): Promise<void> {
  const { db } = options;

  // POST /api/v1/speaking/recording/start — create server-owned recording
  app.post('/api/v1/speaking/recording/start', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;

    const parsed = StartRecordingSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: formatZodError(parsed.error) });
    }
    const { attemptId, recordingProfileId } = parsed.data;

    const existing = await phaseL.speakingRecordings.getRecordingByAttempt(db, attemptId);
    if (existing) {
      const session = existing.upload_session_id
        ? await phaseL.speakingRecordings.getUploadSession(db, existing.upload_session_id)
        : null;
      return reply.status(200).send({
        recording: existing,
        uploadSession: session ?? undefined,
        resumed: true,
      });
    }

    const recording = await phaseL.speakingRecordings.createRecording(db, attemptId, auth.userId, recordingProfileId);

    await phaseL.speakingRecordings.createAttemptRight(db, recording.id, 1);

    return reply.status(201).send({ recording, resumed: false });
  });

  // POST /api/v1/speaking/upload/start — create/resume upload session
  app.post('/api/v1/speaking/upload/start', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;

    const parsed = StartUploadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: formatZodError(parsed.error) });
    }
    const { recordingId, totalChunks } = parsed.data;

    const recording = await phaseL.speakingRecordings.getRecording(db, recordingId);
    if (!recording) return reply.status(404).send({ error: 'Recording not found' });
    if (recording.user_id !== auth.userId && !hasPermission(auth.roles as UserRole[], 'content:edit')) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    if (recording.finalisation_state === 'finalised' || recording.finalisation_state === 'rejected') {
      return reply.status(400).send({ error: 'Recording is already finalised or rejected' });
    }

    const existingSession = recording.upload_session_id
      ? await phaseL.speakingRecordings.getUploadSession(db, recording.upload_session_id)
      : null;

    if (existingSession && existingSession.total_chunks === totalChunks) {
      const chunks = await phaseL.speakingRecordings.getChunksForSession(db, existingSession.id);
      return reply.status(200).send({
        uploadSession: existingSession,
        acknowledgedChunks: chunks.map((c) => c.sequence_number),
        resumed: true,
      });
    }

    const session = await phaseL.speakingRecordings.createUploadSession(db, recordingId, totalChunks);

    await phaseL.speakingRecordings.updateRecordingState(db, recordingId, 'upload-queued');

    return reply.status(201).send({
      uploadSession: session,
      acknowledgedChunks: [],
      resumed: false,
    });
  });

  // POST /api/v1/speaking/upload/chunk — upload one ordered chunk
  app.post('/api/v1/speaking/upload/chunk', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;

    const parsed = ChunkUploadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: formatZodError(parsed.error) });
    }
    const { uploadSessionId, sequenceNumber, byteCount, data, checksum } = parsed.data;

    const session = await phaseL.speakingRecordings.getUploadSession(db, uploadSessionId);
    if (!session) return reply.status(404).send({ error: 'Upload session not found' });

    if (session.state === 'completed' || session.state === 'failed' || session.state === 'expired') {
      return reply.status(400).send({ error: `Cannot upload to ${session.state} session` });
    }

    const recording = await phaseL.speakingRecordings.getRecording(db, session.recording_id);
    if (!recording) return reply.status(404).send({ error: 'Recording not found' });
    if (recording.user_id !== auth.userId) return reply.status(403).send({ error: 'Forbidden' });

    if (recording.state !== 'uploading' && recording.state !== 'upload-queued') {
      await phaseL.speakingRecordings.updateRecordingState(db, recording.id, 'uploading');
    }

    if (sequenceNumber >= session.total_chunks) {
      return reply.status(400).send({ error: `Chunk index ${sequenceNumber} exceeds total ${session.total_chunks}` });
    }

    const chunkKey = `recording_${recording.id}_chunk_${String(sequenceNumber).padStart(6, '0')}`;
    const chunkData = Buffer.from(data, 'base64');

    storeChunk(chunkKey, chunkData);

    const { chunk, conflict } = await phaseL.speakingRecordings.acknowledgeChunk(
      db,
      uploadSessionId,
      sequenceNumber,
      byteCount,
      chunkKey,
      checksum,
    );

    if (conflict) {
      return reply.status(409).send({
        error: 'Chunk conflict — sequence number already occupied by different data',
        existingChunk: { id: chunk.id, sequenceNumber: chunk.sequence_number },
      });
    }

    return reply.status(200).send({
      chunk: {
        id: chunk.id,
        sequenceNumber: chunk.sequence_number,
        acknowledgedAt: chunk.acknowledged_at,
      },
      acknowledgedCount: session.acknowledged_chunks + 1,
    });
  });

  // POST /api/v1/speaking/upload/finalize — finalise recording
  app.post('/api/v1/speaking/upload/finalize', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;

    const parsed = FinalizeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: formatZodError(parsed.error) });
    }
    const { recordingId, durationMs } = parsed.data;

    const recording = await phaseL.speakingRecordings.getRecording(db, recordingId);
    if (!recording) return reply.status(404).send({ error: 'Recording not found' });
    if (recording.user_id !== auth.userId) return reply.status(403).send({ error: 'Forbidden' });

    if (recording.finalisation_state === 'finalised') {
      return reply.status(200).send({
        recording,
        message: 'Already finalised',
        idempotent: true,
      });
    }

    if (recording.finalisation_state === 'rejected') {
      return reply.status(400).send({ error: 'Recording was rejected and cannot be finalised' });
    }

    if (!recording.upload_session_id) {
      return reply.status(400).send({ error: 'No upload session exists for this recording' });
    }

    const session = await phaseL.speakingRecordings.getUploadSession(db, recording.upload_session_id);
    if (!session) return reply.status(404).send({ error: 'Upload session not found' });

    const chunks = await phaseL.speakingRecordings.getChunksForSession(db, recording.upload_session_id);

    const acknowledgedSet = new Set(session.acknowledged_sequence_numbers);
    const missingChunks: number[] = [];
    for (let i = 0; i < session.total_chunks; i++) {
      if (!acknowledgedSet.has(i)) missingChunks.push(i);
    }

    if (missingChunks.length > 0) {
      return reply.status(400).send({
        error: 'Upload incomplete',
        missingChunkIndexes: missingChunks,
        acknowledgedCount: acknowledgedSet.size,
        totalChunks: session.total_chunks,
      });
    }

    if (durationMs !== undefined) {
      await phaseL.speakingRecordings.updateRecordingDuration(db, recordingId, durationMs);
    }

    await phaseL.speakingRecordings.completeUploadSession(db, recording.upload_session_id);

    const updated = await phaseL.speakingRecordings.finaliseRecording(db, recordingId);

    await phaseL.speakingRecordings.consumeAttemptRight(db, recordingId, 1, 'uploaded');

    return reply.status(200).send({
      recording: updated,
      acknowledgedChunkCount: chunks.length,
      idempotent: false,
    });
  });

  // GET /api/v1/speaking/recording/:id/status — query recording + upload status
  app.get('/api/v1/speaking/recording/:id/status', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    const { id } = request.params as { id: string };

    const recording = await phaseL.speakingRecordings.getRecording(db, id);
    if (!recording) return reply.status(404).send({ error: 'Recording not found' });
    if (recording.user_id !== auth.userId && !hasPermission(auth.roles as UserRole[], 'content:edit')) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    let uploadSession: Awaited<ReturnType<typeof phaseL.speakingRecordings.getUploadSession>>;
    let chunks: unknown[] = [];
    const missingChunks: number[] = [];

    if (recording.upload_session_id) {
      const session = await phaseL.speakingRecordings.getUploadSession(db, recording.upload_session_id);
      uploadSession = session;
      if (session) {
        const chunkRows = await phaseL.speakingRecordings.getChunksForSession(db, session.id);
        chunks = chunkRows;
        const acknowledgedSet = new Set(session.acknowledged_sequence_numbers ?? []);
        for (let i = 0; i < session.total_chunks; i++) {
          if (!acknowledgedSet.has(i)) missingChunks.push(i);
        }
      }
    }

    return reply.status(200).send({
      recording,
      uploadSession: uploadSession ?? null,
      chunks,
      missingChunkIndexes: missingChunks,
      isComplete: missingChunks.length === 0 && recording.upload_session_id !== null,
    });
  });
}
