'use client';

import { useState, useEffect, use } from 'react';
import { Container, Card, Badge, Button, Alert, Input } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ProvenanceDetail {
  id: string;
  contentId: string;
  contentVersionId: string;
  sourceId: string;
  licenceId: string | null;
  ownershipType: string;
  verificationStatus: string;
  publicationStatus: string;
  attribution: string;
  evidenceIds: string[];
  createdBy: string;
  createdAt: string;
}

export default function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [record, setRecord] = useState<ProvenanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/content-provenance/records/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load record');
        setRecord(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Load failed');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function doAction(action: string, body?: Record<string, unknown>) {
    setActionError('');
    setActionSuccess('');
    const headers: Record<string, string> = {};
    if (body) headers['Content-Type'] = 'application/json';
    try {
      const res = await fetch(`${API_URL}/content-provenance/records/${id}/${action}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || `Action ${action} failed`);
      setActionSuccess(`${action} completed successfully. Status: ${data.verificationStatus}`);
      setRecord(data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `${action} failed`);
    }
  }

  if (loading)
    return (
      <Container>
        <p>Loading...</p>
      </Container>
    );
  if (error)
    return (
      <Container>
        <Alert>{error}</Alert>
      </Container>
    );
  if (!record)
    return (
      <Container>
        <Alert>Record not found</Alert>
      </Container>
    );

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>
          Record <span data-testid="record-id-display">#{record.id}</span>
        </h1>
        {actionError && <Alert>{actionError}</Alert>}
        {actionSuccess && <Alert data-testid="action-success">{actionSuccess}</Alert>}
        <Card data-testid="record-detail-card">
          <dl style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0.5rem' }}>
            <dt style={{ fontWeight: 600 }}>Status:</dt>
            <dd data-testid="record-status">
              <Badge
                variant={
                  record.verificationStatus === 'rejected'
                    ? 'danger'
                    : record.verificationStatus === 'verified'
                      ? 'success'
                      : 'default'
                }
              >
                {record.verificationStatus}
              </Badge>
            </dd>
            <dt style={{ fontWeight: 600 }}>Content ID:</dt>
            <dd data-testid="record-content-id">{record.contentId}</dd>
            <dt style={{ fontWeight: 600 }}>Attribution:</dt>
            <dd data-testid="record-attribution">{record.attribution}</dd>
          </dl>
        </Card>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {record.verificationStatus === 'draft' && (
            <>
              <Button data-testid="btn-submit" onClick={() => doAction('submit')}>
                Submit for Review
              </Button>
              <Button
                data-testid="btn-similarity"
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_URL}/content-provenance/similarity-checks`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ contentId: record.contentId, contentVersionId: record.contentVersionId }),
                    });
                    const data = await res.json();
                    if (!res.ok) setActionError(data.error || 'Similarity check failed');
                    else setActionSuccess(`Similarity check completed. Score: ${data.similarityScore}`);
                  } catch (err) {
                    setActionError(err instanceof Error ? err.message : 'Similarity check failed');
                  }
                }}
              >
                Run Similarity Check
              </Button>
            </>
          )}
          {record.verificationStatus === 'submitted' && (
            <Button data-testid="btn-start-review" onClick={() => doAction('start-review')}>
              Start Review
            </Button>
          )}
          {record.verificationStatus === 'under_review' && (
            <>
              <Button data-testid="btn-verify" onClick={() => doAction('verify')}>
                Verify / Approve
              </Button>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Input
                  data-testid="reject-reason-input"
                  placeholder="Rejection reason"
                  value={rejectReason}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectReason(e.target.value)}
                />
                <Button
                  variant="danger"
                  data-testid="btn-reject"
                  onClick={() => doAction('reject', { reason: rejectReason })}
                >
                  Reject
                </Button>
              </div>
            </>
          )}
          {record.verificationStatus === 'rejected' && (
            <>
              <Button data-testid="btn-resubmit" onClick={() => doAction('update', { verificationStatus: 'draft' })}>
                Edit & Resubmit
              </Button>
            </>
          )}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <a href="/content/provenance/review" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Back to review queue
          </a>
        </div>
      </Container>
    </main>
  );
}
