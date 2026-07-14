import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { DatabaseConnection } from '@pte-app/database';
import { sources, licences, provenanceRepo, evidenceRepo } from '@pte-app/database';
import type { UserRole } from '../auth/rbac.js';
import { evaluatePublicationEligibility } from '@pte-app/domain';
import type { ProvenancePolicy } from '@pte-app/contracts';

const defaultPolicy: ProvenancePolicy = {
  id: 'policy-001' as any,
  version: '1.0.0',
  similarityReviewThreshold: 30,
  similarityBlockThreshold: 60,
  expiryWarningDays: 30,
  evidenceRetentionDays: 365 * 7,
  requiredEvidenceByOwnership: { platform_original: ['original_draft'] },
  prohibitedRules: ['private_exam_material', 'copyrighted_without_permission'],
  supportedSourceTypes: [
    'original_creation_record',
    'licence_agreement',
    'public_domain_record',
    'open_licence_source',
    'commissioned_work',
    'internal_reference',
    'authorised_external_reference',
  ],
  supportedLicenceTypes: ['exclusive', 'non_exclusive', 'open', 'public_domain', 'statutory'],
};

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

  // Sources
  app.get('/content-provenance/sources', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    return reply.status(200).send(await sources.listSources(db));
  });

  app.post('/content-provenance/sources', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const body = request.body as any;
    const record = await sources.createSource(db, {
      id: crypto.randomUUID() as any,
      sourceType: body.sourceType,
      title: body.title,
      owner: body.owner,
      publisher: body.publisher,
      sourceUrl: body.sourceUrl || '',
      jurisdiction: body.jurisdiction || '',
      sourceDate: body.sourceDate,
      accessDate: body.accessDate,
      description: body.description || '',
      createdBy: auth.userId as any,
    });
    return reply.status(201).send(record);
  });

  app.get('/content-provenance/sources/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await sources.getSourceById(db, id as any);
    if (!record) return reply.status(404).send({ error: 'Not found' });
    return reply.status(200).send(record);
  });

  app.patch('/content-provenance/sources/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const record = await sources.updateSource(db, id as any, body, body.expectedVersion);
    if (!record) return reply.status(409).send({ error: 'Version conflict' });
    return reply.status(200).send(record);
  });

  // Licences
  app.get('/content-provenance/licences', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    return reply.status(200).send(await licences.listLicences(db));
  });

  app.post('/content-provenance/licences', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const body = request.body as any;
    const record = await licences.createLicence(db, {
      id: crypto.randomUUID() as any,
      licenceType: body.licenceType,
      licensor: body.licensor,
      licensee: body.licensee,
      rightsGranted: body.rightsGranted || [],
      prohibitedUses: body.prohibitedUses || [],
      attributionRequired: body.attributionRequired || false,
      commercialUseAllowed: body.commercialUseAllowed || false,
      modificationAllowed: body.modificationAllowed || false,
      redistributionAllowed: body.redistributionAllowed || false,
      validFrom: body.validFrom,
      validUntil: body.validUntil || null,
      jurisdiction: body.jurisdiction || '',
      createdBy: auth.userId as any,
    });
    return reply.status(201).send(record);
  });

  app.get('/content-provenance/licences/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await licences.getLicenceById(db, id as any);
    if (!record) return reply.status(404).send({ error: 'Not found' });
    return reply.status(200).send(record);
  });

  // Provenance records
  app.get('/content-provenance/records', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    return reply.status(200).send(await provenanceRepo.listProvenanceRecords(db));
  });

  app.post('/content-provenance/records', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const body = request.body as any;
    const record = await provenanceRepo.createProvenance(db, {
      id: crypto.randomUUID() as any,
      contentId: body.contentId,
      contentVersionId: body.contentVersionId,
      sourceId: body.sourceId,
      licenceId: body.licenceId || null,
      ownershipType: body.ownershipType,
      attribution: body.attribution || '',
      evidenceIds: body.evidenceIds || [],
      createdBy: auth.userId as any,
    });
    return reply.status(201).send(record);
  });

  app.get('/content-provenance/records/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await provenanceRepo.getProvenanceById(db, id as any);
    if (!record) return reply.status(404).send({ error: 'Not found' });
    return reply.status(200).send(record);
  });

  app.post('/content-provenance/records/:id/submit', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await provenanceRepo.updateProvenanceStatus(db, id as any, 'submitted');
    if (!record) return reply.status(404).send({ error: 'Not found' });
    return reply.status(200).send(record);
  });

  app.post('/content-provenance/records/:id/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['admin'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await provenanceRepo.updateProvenanceStatus(db, id as any, 'verified', auth.userId as any);
    if (!record) return reply.status(404).send({ error: 'Not found' });
    return reply.status(200).send(record);
  });

  app.post('/content-provenance/records/:id/reject', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['admin'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await provenanceRepo.updateProvenanceStatus(db, id as any, 'rejected', auth.userId as any);
    if (!record) return reply.status(404).send({ error: 'Not found' });
    return reply.status(200).send(record);
  });

  // Evidence
  app.post('/content-provenance/evidence', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const body = request.body as any;
    const record = await evidenceRepo.createEvidence(db, {
      id: crypto.randomUUID() as any,
      evidenceType: body.evidenceType,
      fileName: body.fileName,
      mediaId: body.mediaId,
      checksum: body.checksum,
      mimeType: body.mimeType,
      description: body.description || '',
      uploadedBy: auth.userId as any,
      retainedUntil: body.retainedUntil || new Date(Date.now() + 365 * 7 * 86400000).toISOString(),
    });
    return reply.status(201).send(record);
  });

  app.get('/content-provenance/evidence/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin', 'support'], reply)) return;
    const { id } = request.params as { id: string };
    const record = await evidenceRepo.getEvidenceById(db, id as any);
    if (!record) return reply.status(404).send({ error: 'Not found' });
    return reply.status(200).send(record);
  });

  // Publication check
  app.post('/content-provenance/publication-check', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['content_editor', 'admin'], reply)) return;
    const body = request.body as { contentId: string; contentVersionId: string };
    const provenance = await provenanceRepo.getProvenanceById(db, body.contentId as any);
    if (!provenance) {
      return reply.status(200).send(
        evaluatePublicationEligibility({
          provenance: null,
          source: null,
          licence: null,
          similarity: null,
          policy: defaultPolicy,
          contentVersionId: body.contentVersionId,
        }),
      );
    }
    const source = (provenance ? await sources.getSourceById(db, provenance.sourceId) : null) ?? null;
    const licence = (provenance?.licenceId ? await licences.getLicenceById(db, provenance.licenceId) : null) ?? null;
    return reply.status(200).send(
      evaluatePublicationEligibility({
        provenance,
        source,
        licence,
        similarity: null,
        policy: defaultPolicy,
        contentVersionId: body.contentVersionId,
      }),
    );
  });

  app.get('/content-provenance/audit-report', async (request: FastifyRequest, reply: FastifyReply) => {
    const auth = getAuth(request, reply);
    if (!auth) return;
    if (!requireRoles(auth, ['admin'], reply)) return;
    const records = await provenanceRepo.listProvenanceRecords(db);
    return reply.status(200).send({
      generatedAt: new Date().toISOString(),
      scope: 'all',
      policyVersion: defaultPolicy.version,
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
      historicalChanges: [],
    });
  });
}
