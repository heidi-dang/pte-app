import { Container, Card } from '@pte-app/design-system';
import { requireRole } from '../../../../../lib/role-guard';

export default async function NewSourcePage() {
  await requireRole('/content');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Create Source</h1>
        <Card>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Source Type</span>
              <select
                name="sourceType"
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
              >
                <option value="original_creation_record">Original Creation Record</option>
                <option value="contributor_declaration">Contributor Declaration</option>
                <option value="licence_agreement">Licence Agreement</option>
                <option value="public_domain_record">Public Domain Record</option>
                <option value="open_licence_source">Open Licence Source</option>
                <option value="commissioned_work">Commissioned Work</option>
                <option value="internal_reference">Internal Reference</option>
                <option value="authorised_external_reference">Authorised External Reference</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Title</span>
              <input
                name="title"
                required
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Owner</span>
              <input
                name="owner"
                required
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Publisher</span>
              <input
                name="publisher"
                required
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Source URL</span>
              <input
                name="sourceUrl"
                type="url"
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Source Date</span>
              <input
                name="sourceDate"
                type="datetime-local"
                required
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Access Date</span>
              <input
                name="accessDate"
                type="datetime-local"
                required
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Description</span>
              <textarea
                name="description"
                rows={3}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Create Source
              </button>
              <a
                href="/content/provenance/sources"
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  color: 'var(--color-text)',
                }}
              >
                Cancel
              </a>
            </div>
          </form>
        </Card>
      </Container>
    </main>
  );
}
