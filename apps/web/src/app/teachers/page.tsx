import { Container, Card, Badge } from '@pte-app/design-system';
import { MOCK_TEACHERS } from '@/lib/mock-data';

export const metadata = {
  title: 'Teachers — PTE Academy',
  description: 'Meet the experienced PTE Academic instructors behind PTE Academy.',
};

export default function TeachersPage() {
  return (
    <main>
      <Container>
        <div className="landing__section-header">
          <h1 className="landing__section-title">Our teachers</h1>
          <p className="landing__section-subtitle">Learn from experienced PTE instructors and exam specialists.</p>
        </div>
        <div className="status-grid">
          {MOCK_TEACHERS.map((teacher) => (
            <Card key={teacher.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  {teacher.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="landing__feature-title">{teacher.name}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{teacher.title}</p>
                </div>
              </div>
              <p className="landing__feature-desc">{teacher.bio}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                {teacher.specialties.map((specialty) => (
                  <Badge key={specialty}>{specialty}</Badge>
                ))}
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                ⭐ {teacher.rating} · {teacher.students} students · {teacher.country}
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
