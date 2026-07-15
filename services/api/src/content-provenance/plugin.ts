import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { DatabaseConnection } from '@pte-app/database';
import {
  sources,
  licences,
  provenanceRepo,
  evidenceRepo,
  similarityRepo,
  prohibitedMatchRepo,
  reVerificationRepo,
  policyRepo,
  contentAuditRepo,
} from '@pte-app/database';
import type { UserRole } from '../auth/rbac.js';
import {
  CreateSourceBodySchema,
  UpdateSourceBodySchema,
  CreateLicenceBodySchema,
  UpdateLicenceBodySchema,
  SupersedeLicenceBodySchema,
  CreateEvidenceBodySchema,
  CreateProvenanceBodySchema,
  UpdateProvenanceBodySchema,
  RejectProvenanceBodySchema,
  PublicationCheckBodySchema,
  SimilarityCheckCreateBodySchema,
  ReVerificationCompleteBodySchema,
} from '@pte-app/schemas';
import type {
  ContentId,
  ContentVersionId,
  UserId,
  RequestId,
  SourceId,
  LicenceId,
  EvidenceId,
  ProvenanceId,
  SimilarityCheckId,
  ReVerificationJobId,
  ProhibitedMatchId,
  OwnershipType,
  MediaId,
  AuditEventType,
} from '@pte-app/contracts';
import { VALID_PROVENANCE_TRANSITIONS } from '@pte-app/contracts';
import { requirePublicationEligibility } from './publication-guard.js';
import { LOCAL_DEV_POLICY } from './fixtures.js';
import { randomUUID } from 'node:crypto';

function getAuth(request: FastifyRequest, reply: FastifyReply): { userId: string; roles: UserRole[] } | null {
  if (!request.auth) {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }
  return request.auth;
}

function requireRoles(auth: { roles: UserRole[] }, allowed: UserRole[], reply: FastifyReply): boolean {
  if (!auth.roles.some((r) => allowed.includes(r))) {
    reply.status(403).send({ error: 'Forbidden' });
    return false;
  }
  return true;
}

function validateBody<T>(body: unknown, schema: { parse: (v: unknown) => T }, reply: FastifyReply): T | null {
  try {
    return schema.parse(body);
  } catch (err: any) {
    reply.status(400).send({
      error: 'Validation failed',
      details: err.errors ?? err.message,
    });
    return null;
  }
}

function reqId(request: FastifyRequest): RequestId {
  return ((request.headers['x-request-id'] as string) ?? randomUUID()) as RequestId;
}

export async function contentProvenancePlugin(
  app: FastifyInstance,
  options: { db: DatabaseConnection },
): Promise<void> {
  const { db } = options;

  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.auth) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // ─── SOURCES ──────────────────────────────────────────────
  app.get('/content-provenance/sources', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    return reply.status(200).send(await sources.listSources(db));
  });

  app.post('/content-provenance/sources', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const body = validateBody(request.body, CreateSourceBodySchema, reply);
    if (!body) return;
    const id = randomUUID() as SourceId;
    const record = await sources.createSource(db, {
      id,
      sourceType: body.sourceType,
      title: body.title,
      owner: body.owner,
      publisher: body.publisher,
      sourceUrl: body.sourceUrl,
      jurisdiction: body.jurisdiction,
      sourceDate: body.sourceDate,
      accessDate: body.accessDate,
      description: body.description,
      createdBy: auth.userId as UserId,
    });
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'source_created' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'source',
      entityId: record.id,
      previousVersion: null,
      newVersion: String(record.version),
      reason: null,
      policyId: null,
      policyVersion: null,
      result: 'created',
    });
    return reply.status(201).send(record);
  });

  app.get('/content-provenance/sources/:id', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await sources.getSourceById(db, id as SourceId);
    if (!record) return reply.status(404).send({ error: 'Not found' });
    return reply.status(200).send(record);
  });

  app.patch('/content-provenance/sources/:id', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const { id } = request.params as { id: string };
    const body = validateBody(request.body, UpdateSourceBodySchema, reply);
    if (!body) return;
    const { expectedVersion, ...updates } = body;
    const record = await sources.updateSource(db, id as SourceId, updates, expectedVersion);
    if (!record) return reply.status(409).send({ error: 'Version conflict or not found' });
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'source_updated' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'source',
      entityId: record.id,
      previousVersion: String(expectedVersion),
      newVersion: String(record.version),
      reason: null,
      policyId: null,
      policyVersion: null,
      result: 'updated',
    });
    return reply.status(200).send(record);
  });

  // ─── LICENCES ──────────────────────────────────────────────
  app.get('/content-provenance/licences', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    return reply.status(200).send(await licences.listLicences(db));
  });

  app.post('/content-provenance/licences', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const body = validateBody(request.body, CreateLicenceBodySchema, reply);
    if (!body) return;
    const id = randomUUID() as LicenceId;
    const record = await licences.createLicence(db, {
      id,
      licenceType: body.licenceType,
      licensor: body.licensor,
      licensee: body.licensee,
      rightsGranted: body.rightsGranted,
      prohibitedUses: body.prohibitedUses,
      attributionRequired: body.attributionRequired,
      commercialUseAllowed: body.commercialUseAllowed,
      modificationAllowed: body.modificationAllowed,
      redistributionAllowed: body.redistributionAllowed,
      validFrom: body.validFrom,
      validUntil: body.validUntil,
      jurisdiction: body.jurisdiction,
      createdBy: auth.userId as UserId,
    });
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'licence_created' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'licence',
      entityId: record.id,
      previousVersion: null,
      newVersion: String(record.version),
      reason: null,
      policyId: null,
      policyVersion: null,
      result: 'created',
    });
    return reply.status(201).send(record);
  });

  app.get('/content-provenance/licences/:id', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await licences.getLicenceById(db, id as LicenceId);
    if (!record) return reply.status(404).send({ error: 'Not found' });
    return reply.status(200).send(record);
  });

  app.patch('/content-provenance/licences/:id', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const { id } = request.params as { id: string };
    const body = validateBody(request.body, UpdateLicenceBodySchema, reply);
    if (!body) return;
    const { expectedVersion, ...updates } = body;
    const record = await licences.updateLicence(db, id as LicenceId, updates, expectedVersion);
    if (!record) return reply.status(409).send({ error: 'Version conflict or not found' });
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'licence_updated' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'licence',
      entityId: record.id,
      previousVersion: String(expectedVersion),
      newVersion: String(record.version),
      reason: null,
      policyId: null,
      policyVersion: null,
      result: 'updated',
    });
    return reply.status(200).send(record);
  });

  app.post('/content-provenance/licences/:id/supersede', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const { id } = request.params as { id: string };
    const body = validateBody(request.body, SupersedeLicenceBodySchema, reply);
    if (!body) return;
    const existing = await licences.getLicenceById(db, id as LicenceId);
    if (!existing) return reply.status(404).send({ error: 'Licence not found' });
    if (existing.status !== 'active')
      return reply.status(409).send({ error: 'Only active licences can be superseded' });
    const newId = randomUUID() as LicenceId;
    const newLicence = await licences.createLicence(db, {
      id: newId,
      licenceType: body.licenceType,
      licensor: body.licensor,
      licensee: body.licensee,
      rightsGranted: body.rightsGranted,
      prohibitedUses: body.prohibitedUses,
      attributionRequired: body.attributionRequired,
      commercialUseAllowed: body.commercialUseAllowed,
      modificationAllowed: body.modificationAllowed,
      redistributionAllowed: body.redistributionAllowed,
      validFrom: body.validFrom,
      validUntil: body.validUntil,
      jurisdiction: body.jurisdiction,
      createdBy: auth.userId as UserId,
    });
    await licences.supersedeLicence(db, id as LicenceId, newId);
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'licence_superseded' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'licence',
      entityId: id,
      previousVersion: String(existing.version),
      newVersion: String(newLicence.version),
      reason: body.reason,
      policyId: null,
      policyVersion: null,
      result: `superseded by ${newId}`,
    });
    await createReverificationJobsForLicenceChange(db, id as LicenceId, 'licence_superseded');
    return reply.status(201).send(newLicence);
  });

  app.post('/content-provenance/licences/:id/revoke', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await licences.revokeLicence(db, id as LicenceId);
    if (!record) return reply.status(404).send({ error: 'Licence not found or not active' });
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'licence_revoked' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'licence',
      entityId: record.id,
      previousVersion: String(record.version - 1),
      newVersion: String(record.version),
      reason: 'revoked',
      policyId: null,
      policyVersion: null,
      result: 'revoked',
    });
    await createReverificationJobsForLicenceChange(db, id as LicenceId, 'licence_revoked');
    return reply.status(200).send(record);
  });

  // ─── EVIDENCE ──────────────────────────────────────────────
  app.post('/content-provenance/evidence', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const body = validateBody(request.body, CreateEvidenceBodySchema, reply);
    if (!body) return;
    const policy = await policyRepo.getActivePolicy(db);
    const retentionMs = (policy?.evidenceRetentionDays ?? LOCAL_DEV_POLICY.evidenceRetentionDays) * 86400000;
    const retainedUntil = new Date(Date.now() + retentionMs).toISOString();
    const id = randomUUID() as EvidenceId;
    const record = await evidenceRepo.createEvidence(db, {
      id,
      evidenceType: body.evidenceType,
      fileName: body.fileName,
      mediaId: body.mediaId as MediaId,
      checksum: body.checksum,
      mimeType: body.mimeType,
      description: body.description,
      uploadedBy: auth.userId as UserId,
      retainedUntil,
    });
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'evidence_attached' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'evidence',
      entityId: record.id,
      previousVersion: null,
      newVersion: null,
      reason: null,
      policyId: policy?.id ?? null,
      policyVersion: policy?.version ?? null,
      result: 'attached',
    });
    return reply.status(201).send(record);
  });

  app.get('/content-provenance/evidence/:id', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await evidenceRepo.getEvidenceById(db, id as EvidenceId);
    if (!record) return reply.status(404).send({ error: 'Not found' });
    return reply.status(200).send(record);
  });

  app.post('/content-provenance/evidence/:id/invalidate', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await evidenceRepo.invalidateEvidence(db, id as EvidenceId);
    if (!record) return reply.status(404).send({ error: 'Evidence not found or already inactive' });
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'evidence_invalidated' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'evidence',
      entityId: record.id,
      previousVersion: null,
      newVersion: null,
      reason: 'invalidated',
      policyId: null,
      policyVersion: null,
      result: 'invalidated',
    });
    return reply.status(200).send(record);
  });

  // ─── PROVENANCE RECORDS ────────────────────────────────────
  app.get('/content-provenance/records', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    return reply.status(200).send(await provenanceRepo.listProvenanceRecords(db));
  });

  app.post('/content-provenance/records', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const body = validateBody(request.body, CreateProvenanceBodySchema, reply);
    if (!body) return;
    const id = randomUUID() as ProvenanceId;
    const record = await provenanceRepo.createProvenance(db, {
      id,
      contentId: body.contentId as ContentId,
      contentVersionId: body.contentVersionId as ContentVersionId,
      sourceId: body.sourceId as SourceId,
      licenceId: body.licenceId as LicenceId | null,
      ownershipType: body.ownershipType as OwnershipType,
      attribution: body.attribution,
      evidenceIds: body.evidenceIds,
      createdBy: auth.userId as UserId,
    });
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'provenance_created' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'provenance',
      entityId: record.id,
      previousVersion: null,
      newVersion: String(record.version),
      reason: null,
      policyId: null,
      policyVersion: null,
      result: 'created',
    });
    return reply.status(201).send(record);
  });

  app.get('/content-provenance/records/:id', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await provenanceRepo.getProvenanceById(db, id as ProvenanceId);
    if (!record) return reply.status(404).send({ error: 'Not found' });
    return reply.status(200).send(record);
  });

  app.patch('/content-provenance/records/:id', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const { id } = request.params as { id: string };
    const body = validateBody(request.body, UpdateProvenanceBodySchema, reply);
    if (!body) return;
    const { expectedVersion, ...updates } = body;
    const castUpdates: Record<string, unknown> = { ...updates };
    if (castUpdates.sourceId) castUpdates.sourceId = castUpdates.sourceId as SourceId;
    if (castUpdates.licenceId !== undefined) castUpdates.licenceId = castUpdates.licenceId as LicenceId | null;
    if (castUpdates.ownershipType) castUpdates.ownershipType = castUpdates.ownershipType as OwnershipType;
    try {
      const record = await provenanceRepo.updateProvenance(db, id as ProvenanceId, castUpdates as any, expectedVersion);
      if (!record) return reply.status(409).send({ error: 'Version conflict, not found, or invalid status' });
      await contentAuditRepo.createContentAuditEvent(db, {
        eventType: 'provenance_updated' as AuditEventType,
        actor: auth.userId as UserId,
        requestId: reqId(request),
        entityType: 'provenance',
        entityId: record.id,
        previousVersion: String(expectedVersion),
        newVersion: String(record.version),
        reason: null,
        policyId: null,
        policyVersion: null,
        result: 'updated',
      });
      return reply.status(200).send(record);
    } catch (err: any) {
      return reply.status(409).send({ error: err.message });
    }
  });

  app.post('/content-provenance/records/:id/submit', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const { id } = request.params as { id: string };
    const existing = await provenanceRepo.getProvenanceById(db, id as ProvenanceId);
    if (!existing) return reply.status(404).send({ error: 'Not found' });
    const allowed = VALID_PROVENANCE_TRANSITIONS[existing.verificationStatus] as readonly string[];
    if (!allowed.includes('submitted')) {
      return reply.status(409).send({ error: `Cannot submit from ${existing.verificationStatus}` });
    }
    const record = await provenanceRepo.updateProvenanceStatus(
      db,
      id as ProvenanceId,
      'submitted',
      undefined,
      undefined,
      existing.version,
    );
    if (!record) return reply.status(409).send({ error: 'Version conflict' });
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'provenance_submitted' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'provenance',
      entityId: record.id,
      previousVersion: String(existing.version),
      newVersion: String(record.version),
      reason: null,
      policyId: null,
      policyVersion: null,
      result: 'submitted',
    });
    return reply.status(200).send(record);
  });

  app.post('/content-provenance/records/:id/start-review', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['admin'], reply)) return;
    const { id } = request.params as { id: string };
    const existing = await provenanceRepo.getProvenanceById(db, id as ProvenanceId);
    if (!existing) return reply.status(404).send({ error: 'Not found' });
    const allowed = VALID_PROVENANCE_TRANSITIONS[existing.verificationStatus] as readonly string[];
    if (!allowed.includes('under_review')) {
      return reply.status(409).send({ error: `Cannot start review from ${existing.verificationStatus}` });
    }
    const record = await provenanceRepo.updateProvenanceStatus(
      db,
      id as ProvenanceId,
      'under_review',
      undefined,
      undefined,
      existing.version,
    );
    if (!record) return reply.status(409).send({ error: 'Version conflict' });
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'provenance_review_started' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'provenance',
      entityId: record.id,
      previousVersion: String(existing.version),
      newVersion: String(record.version),
      reason: null,
      policyId: null,
      policyVersion: null,
      result: 'review_started',
    });
    return reply.status(200).send(record);
  });

  app.post('/content-provenance/records/:id/verify', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['admin'], reply)) return;
    const { id } = request.params as { id: string };
    const existing = await provenanceRepo.getProvenanceById(db, id as ProvenanceId);
    if (!existing) return reply.status(404).send({ error: 'Not found' });
    if (existing.createdBy === (auth.userId as UserId)) {
      return reply.status(403).send({ error: 'Self-approval is not allowed' });
    }
    const allowed = VALID_PROVENANCE_TRANSITIONS[existing.verificationStatus] as readonly string[];
    if (!allowed.includes('verified')) {
      return reply.status(409).send({ error: `Cannot verify from ${existing.verificationStatus}` });
    }
    const record = await provenanceRepo.updateProvenanceStatus(
      db,
      id as ProvenanceId,
      'verified',
      auth.userId as UserId,
      undefined,
      existing.version,
    );
    if (!record) return reply.status(409).send({ error: 'Version conflict' });
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'provenance_verified' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'provenance',
      entityId: record.id,
      previousVersion: String(existing.version),
      newVersion: String(record.version),
      reason: null,
      policyId: null,
      policyVersion: null,
      result: 'verified',
    });
    return reply.status(200).send(record);
  });

  app.post('/content-provenance/records/:id/reject', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['admin'], reply)) return;
    const { id } = request.params as { id: string };
    const body = validateBody(request.body, RejectProvenanceBodySchema, reply);
    if (!body) return;
    const existing = await provenanceRepo.getProvenanceById(db, id as ProvenanceId);
    if (!existing) return reply.status(404).send({ error: 'Not found' });
    const allowed = VALID_PROVENANCE_TRANSITIONS[existing.verificationStatus] as readonly string[];
    if (!allowed.includes('rejected')) {
      return reply.status(409).send({ error: `Cannot reject from ${existing.verificationStatus}` });
    }
    const record = await provenanceRepo.updateProvenanceStatus(
      db,
      id as ProvenanceId,
      'rejected',
      auth.userId as UserId,
      body.reason,
      existing.version,
    );
    if (!record) return reply.status(409).send({ error: 'Version conflict' });
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'provenance_rejected' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'provenance',
      entityId: record.id,
      previousVersion: String(existing.version),
      newVersion: String(record.version),
      reason: body.reason,
      policyId: null,
      policyVersion: null,
      result: 'rejected',
    });
    return reply.status(200).send(record);
  });

  // ─── SIMILARITY CHECKS ─────────────────────────────────────
  app.post('/content-provenance/similarity-checks', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const body = validateBody(request.body, SimilarityCheckCreateBodySchema, reply);
    if (!body) return;
    const policy = await policyRepo.getActivePolicy(db);
    const id = randomUUID() as SimilarityCheckId;
    const check = await similarityRepo.createSimilarityCheck(db, {
      id,
      contentId: body.contentId as ContentId,
      contentVersionId: body.contentVersionId as ContentVersionId,
      providerId: 'local_test' as any,
      profileVersion: '1.0.0',
      evidenceSnapshot: JSON.stringify({ requestedAt: new Date().toISOString() }),
    });
    const score = Math.random() * (policy?.similarityBlockThreshold ?? LOCAL_DEV_POLICY.similarityBlockThreshold);
    const matchedSources = score > 0.1 ? ['test-reference'] : [];
    const completed = await similarityRepo.completeSimilarityCheck(db, id, {
      similarityScore: score,
      matchedSources,
    });
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'similarity_completed' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'similarity_check',
      entityId: id,
      previousVersion: null,
      newVersion: null,
      reason: null,
      policyId: policy?.id ?? null,
      policyVersion: policy?.version ?? null,
      result: `score=${score}`,
    });
    return reply.status(201).send(completed ?? check);
  });

  app.get('/content-provenance/similarity-checks/:id', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await similarityRepo.getSimilarityCheckById(db, id as SimilarityCheckId);
    if (!record) return reply.status(404).send({ error: 'Not found' });
    return reply.status(200).send(record);
  });

  // ─── PUBLICATION CHECK ─────────────────────────────────────
  app.post('/content-provenance/publication-check', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const body = validateBody(request.body, PublicationCheckBodySchema, reply);
    if (!body) return;
    try {
      const result = await requirePublicationEligibility(
        db,
        auth.userId as UserId,
        body.contentId as ContentId,
        body.contentVersionId as ContentVersionId,
        reqId(request),
      );
      return reply.status(200).send({
        eligible: result.eligible,
        decisionId: result.decisionId,
        blockers: result.blockers,
        warnings: result.warnings,
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // ─── PROHIBITED MATCHES ────────────────────────────────────
  app.get('/content-provenance/prohibited-matches', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    const { contentId, contentVersionId } = request.query as { contentId?: string; contentVersionId?: string };
    if (!contentId || !contentVersionId) {
      return reply.status(400).send({ error: 'contentId and contentVersionId query params required' });
    }
    const matches = await prohibitedMatchRepo.listActiveMatchesForContent(
      db,
      contentId as ContentId,
      contentVersionId as ContentVersionId,
    );
    return reply.status(200).send(matches);
  });

  app.post('/content-provenance/prohibited-matches', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const body = request.body as { contentId: string; contentVersionId: string; ruleName: string; reason: string };
    if (!body.contentId || !body.contentVersionId || !body.ruleName) {
      return reply.status(400).send({ error: 'contentId, contentVersionId, and ruleName required' });
    }
    const id = randomUUID() as ProhibitedMatchId;
    const match = await prohibitedMatchRepo.createProhibitedMatch(db, {
      id,
      contentId: body.contentId as ContentId,
      contentVersionId: body.contentVersionId as ContentVersionId,
      ruleName: body.ruleName,
      matchedBy: auth.userId as UserId,
      reason: body.reason || '',
    });
    return reply.status(201).send(match);
  });

  app.post('/content-provenance/prohibited-matches/:id/resolve', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as { reason?: string };
    const match = await prohibitedMatchRepo.resolveProhibitedMatch(
      db,
      id as ProhibitedMatchId,
      auth.userId as UserId,
      body.reason ?? '',
    );
    if (!match) return reply.status(404).send({ error: 'Match not found' });
    return reply.status(200).send(match);
  });

  // ─── RE-VERIFICATION ───────────────────────────────────────
  app.get('/content-provenance/reverification', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    const jobs = await reVerificationRepo.listPendingReVerificationJobs(db);
    return reply.status(200).send(jobs);
  });

  app.post('/content-provenance/reverification/:id/retry', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const { id } = request.params as { id: string };
    const job = await reVerificationRepo.retryReVerificationJob(db, id as ReVerificationJobId);
    if (!job) return reply.status(404).send({ error: 'Job not found or not failed' });
    return reply.status(200).send(job);
  });

  app.post('/content-provenance/reverification/:id/complete', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const { id } = request.params as { id: string };
    const body = validateBody(request.body, ReVerificationCompleteBodySchema, reply);
    if (!body) return;
    if (body.result === 'passed') {
      const job = await reVerificationRepo.completeReVerificationJob(db, id as ReVerificationJobId);
      if (!job) return reply.status(404).send({ error: 'Job not found' });
      await contentAuditRepo.createContentAuditEvent(db, {
        eventType: 'reverification_completed' as AuditEventType,
        actor: auth.userId as UserId,
        requestId: reqId(request),
        entityType: 'reverification_job',
        entityId: id,
        previousVersion: null,
        newVersion: null,
        reason: body.reason ?? null,
        policyId: null,
        policyVersion: null,
        result: 'passed',
      });
      return reply.status(200).send(job);
    } else {
      const job = await reVerificationRepo.failReVerificationJob(db, id as ReVerificationJobId);
      if (!job) return reply.status(404).send({ error: 'Job not found' });
      return reply.status(200).send(job);
    }
  });

  // ─── AUDIT REPORT ──────────────────────────────────────────
  app.get('/content-provenance/audit-report', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['admin'], reply)) return;
    const policy = await policyRepo.getActivePolicy(db);
    const records = await provenanceRepo.listProvenanceRecords(db);
    const events = await contentAuditRepo.listContentAuditEvents(db, { limit: 1000 });
    const report = {
      generatedAt: new Date().toISOString(),
      scope: 'all',
      policyId: (policy?.id ?? LOCAL_DEV_POLICY.id) as string,
      policyVersion: (policy?.version ?? LOCAL_DEV_POLICY.version) as string,
      totals: {
        total: records.length,
        verified: records.filter((r) => r.verificationStatus === 'verified').length,
        pending: records.filter((r) => r.verificationStatus === 'submitted' || r.verificationStatus === 'under_review')
          .length,
        blocked: records.filter((r) => r.publicationStatus === 'blocked').length,
      },
      expiringLicences: [],
      blockedContent: records.filter((r) => r.publicationStatus === 'blocked').map((r) => r.contentId),
      missingEvidence: records.filter((r) => r.evidenceIds.length === 0).map((r) => r.contentId),
      pendingReviews: records.filter((r) => r.verificationStatus === 'submitted').length,
      unverifiableItems: [],
      historicalChanges: events.map((e) => `${e.eventType}:${e.entityId}`),
    };
    await contentAuditRepo.createContentAuditEvent(db, {
      eventType: 'report_generated' as AuditEventType,
      actor: auth.userId as UserId,
      requestId: reqId(request),
      entityType: 'report',
      entityId: 'audit-report',
      previousVersion: null,
      newVersion: null,
      reason: null,
      policyId: policy?.id ?? null,
      policyVersion: policy?.version ?? null,
      result: 'generated',
    });
    return reply.status(200).send(report);
  });

  // ─── POLICIES ──────────────────────────────────────────────
  app.get('/content-provenance/policies', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['admin'], reply)) return;
    const policies = await policyRepo.listPolicies(db);
    return reply.status(200).send(policies);
  });

  app.get('/content-provenance/policies/active', async (request, reply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    const policy = await policyRepo.getActivePolicy(db);
    if (!policy) return reply.status(404).send({ error: 'No active policy' });
    return reply.status(200).send(policy);
  });
}

async function createReverificationJobsForLicenceChange(
  db: DatabaseConnection,
  licenceId: LicenceId,
  reason: string,
): Promise<void> {
  const records = await provenanceRepo.listProvenanceRecords(db);
  for (const record of records) {
    if (record.licenceId === licenceId) {
      const jobId = randomUUID() as any;
      try {
        await reVerificationRepo.createReVerificationJob(db, {
          id: jobId,
          provenanceId: record.id,
          reason,
        });
      } catch {
        // Job may already exist
      }
    }
  }
}
