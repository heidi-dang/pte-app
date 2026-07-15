import { Container, Card } from '@pte-app/design-system';
import { requireRole } from '../../../../../lib/role-guard';

export default async function NewLicencePage() {
  await requireRole('/content');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Create Licence</h1>
        <Card>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Licence Type</span>
              <select
                name="licenceType"
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
              >
                <option value="exclusive">Exclusive</option>
                <option value="non_exclusive">Non-exclusive</option>
                <option value="open">Open</option>
                <option value="public_domain">Public Domain</option>
                <option value="statutory">Statutory</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Licensor</span>
              <input
                name="licensor"
                required
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Licensee</span>
              <input
                name="licensee"
                required
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Valid From</span>
              <input
                name="validFrom"
                type="date"
                required
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Valid Until</span>
              <input
                name="validUntil"
                type="date"
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" name="commercialUseAllowed" /> Commercial Use Allowed
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" name="modificationAllowed" /> Modification Allowed
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" name="attributionRequired" /> Attribution Required
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" name="redistributionAllowed" /> Redistribution Allowed
              </label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Jurisdiction</span>
              <input
                name="jurisdiction"
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
                Create Licence
              </button>
              <a
                href="/content/provenance/licences"
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
