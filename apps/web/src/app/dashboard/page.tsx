import { redirect } from 'next/navigation';
import { Container, Card, Button, Badge, Progress, StatCard } from '@pte-app/design-system';
import { getCurrentUser } from '@/lib/auth';
import { MOCK_ACTIVITIES, SKILL_BREAKDOWN } from '@/lib/mock-data';

export const metadata = {
  title: 'Dashboard — PTE Academy',
  description: 'Your PTE Academy dashboard.',
};

const SKILLS = [
  { label: 'Speaking', value: SKILL_BREAKDOWN.speaking, color: '#6366f1' },
  { label: 'Writing', value: SKILL_BREAKDOWN.writing, color: '#8b5cf6' },
  { label: 'Reading', value: SKILL_BREAKDOWN.reading, color: '#a78bfa' },
  { label: 'Listening', value: SKILL_BREAKDOWN.listening, color: '#c4b5fd' },
] as const;

const TARGET_SCORE = 79;
const ESTIMATED_SCORE = 72;
const GAP = TARGET_SCORE - ESTIMATED_SCORE;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // TODO(Phase R): Replace this visual placeholder with dashboard analytics aggregation API.
  const firstName = (user.displayName || user.email || 'Student').split(' ')[0];

  return (
    <>
      <style>{`
        .dash-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .dash-header__greeting {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--ds-color-text, #0f172a);
          margin: 0;
        }
        .dash-header__sub {
          font-size: 0.95rem;
          color: var(--ds-color-text-secondary, #64748b);
          margin: 0.25rem 0 0;
        }
        .dash-score-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          font-weight: 600;
          font-size: 0.85rem;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
        }
        .dash-score-pill__num {
          font-size: 1.25rem;
        }

        .dash-grid {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        @media (min-width: 1024px) {
          .dash-grid--2col {
            grid-template-columns: 1fr 1fr;
          }
          .dash-grid--3-1 {
            grid-template-columns: 2fr 1fr;
          }
        }

        .dash-section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--ds-color-text, #0f172a);
          margin: 0 0 1rem;
        }

        .dash-skill-row {
          margin-bottom: 1rem;
        }
        .dash-skill-row:last-child {
          margin-bottom: 0;
        }
        .dash-skill-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          margin-bottom: 0.35rem;
        }
        .dash-skill-name {
          font-weight: 500;
          color: var(--ds-color-text, #0f172a);
        }
        .dash-skill-score {
          font-weight: 700;
          color: #6366f1;
        }

        .dash-activity-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--ds-color-border, #e2e8f0);
        }
        .dash-activity-item:last-child {
          border-bottom: none;
        }
        .dash-activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .dash-activity-dot--Practice { background: #6366f1; }
        .dash-activity-dot--Lesson { background: #10b981; }
        .dash-activity-dot--Mock { background: #f59e0b; }
        .dash-activity-dot--AI { background: #ec4899; }
        .dash-activity-info {
          flex: 1;
          min-width: 0;
        }
        .dash-activity-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--ds-color-text, #0f172a);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dash-activity-meta {
          font-size: 0.75rem;
          color: var(--ds-color-text-secondary, #94a3b8);
          margin: 0;
        }
        .dash-activity-score {
          font-size: 0.8rem;
          font-weight: 700;
          color: #6366f1;
        }

        .dash-target-bar {
          position: relative;
          height: 12px;
          background: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
          margin: 1rem 0 0.5rem;
        }
        .dash-target-bar__fill {
          height: 100%;
          border-radius: 9999px;
          background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 70%, #e2e8f0 100%);
          transition: width 0.6s ease;
        }
        .dash-target-bar__marker {
          position: absolute;
          top: -4px;
          bottom: -4px;
          width: 2px;
          background: #ef4444;
          border-radius: 1px;
        }
        .dash-target-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--ds-color-text-secondary, #94a3b8);
        }
        .dash-target-current {
          font-weight: 700;
          color: #6366f1;
        }
        .dash-target-goal {
          font-weight: 700;
          color: #ef4444;
        }

        .dash-plan-card {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .dash-plan-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6366f1;
          margin: 0;
        }
        .dash-plan-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--ds-color-text, #0f172a);
          margin: 0;
        }
        .dash-plan-desc {
          font-size: 0.875rem;
          color: var(--ds-color-text-secondary, #64748b);
          margin: 0;
          line-height: 1.5;
        }
        .dash-plan-meta {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .dash-plan-meta-item {
          font-size: 0.75rem;
          color: var(--ds-color-text-secondary, #94a3b8);
        }
      `}</style>

      <main style={{ padding: '2rem 0 3rem' }}>
        <Container>
          {/* ── Welcome Header ── */}
          <div className="dash-header">
            <div>
              <h1 className="dash-header__greeting">Welcome back, {firstName}</h1>
              <p className="dash-header__sub">Here is your estimated training score overview for today.</p>
            </div>
            <div className="dash-score-pill">
              <span>Estimated Score</span>
              <span className="dash-score-pill__num">{ESTIMATED_SCORE}</span>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div
            className="dash-grid dash-grid--2col"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
          >
            <StatCard
              title="Estimated Score"
              value={`${ESTIMATED_SCORE}`}
              trend={{ value: 8, label: 'this month', positive: true }}
            />
            <StatCard title="Study Streak" value="12 days" />
            <StatCard title="Tasks Today" value={4} />
            <StatCard title="Mock Exams" value={4} />
          </div>

          {/* ── Main Content Grid ── */}
          <div className="dash-grid dash-grid--3-1" style={{ marginBottom: '2rem' }}>
            {/* Left column: Skill Breakdown + Today's Plan */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Skill Breakdown */}
              <Card>
                <h2 className="dash-section-title">Skill Breakdown</h2>
                {SKILLS.map((skill) => (
                  <div key={skill.label} className="dash-skill-row">
                    <div className="dash-skill-label">
                      <span className="dash-skill-name">{skill.label}</span>
                      <span className="dash-skill-score">{skill.value}</span>
                    </div>
                    <Progress value={skill.value} />
                  </div>
                ))}
              </Card>

              {/* Today's Study Plan */}
              <Card>
                <h2 className="dash-section-title">Today&apos;s Study Plan</h2>
                <div className="dash-plan-card">
                  <p className="dash-plan-label">Recommended Next Lesson</p>
                  <h3 className="dash-plan-title">Speaking: Repeat Sentence Strategy</h3>
                  <p className="dash-plan-desc">
                    Master memory and delivery strategies for the Repeat Sentence task. Focus on chunking, key words,
                    and natural pacing.
                  </p>
                  <div className="dash-plan-meta">
                    <span className="dash-plan-meta-item">Speaking</span>
                    <span className="dash-plan-meta-item">26 min</span>
                    <span className="dash-plan-meta-item">Intermediate</span>
                  </div>
                  <div>
                    <Button variant="primary">Start Lesson</Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right column: Target Progress */}
            <Card style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h2 className="dash-section-title">Target Progress</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--ds-color-text-secondary, #64748b)', margin: 0 }}>
                Close the gap to your target training score.
              </p>

              <div className="dash-target-bar">
                <div
                  className="dash-target-bar__fill"
                  style={{ width: `${(ESTIMATED_SCORE / TARGET_SCORE) * 100}%` }}
                />
                <div className="dash-target-bar__marker" style={{ left: `${(TARGET_SCORE / 100) * 100}%` }} />
              </div>
              <div className="dash-target-labels">
                <span className="dash-target-current">Current: {ESTIMATED_SCORE}</span>
                <span className="dash-target-goal">Target: {TARGET_SCORE}</span>
              </div>

              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  background: '#f1f5f9',
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Points to target</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1.75rem', fontWeight: 700, color: '#6366f1' }}>{GAP}</p>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <Button variant="secondary" style={{ width: '100%' }}>
                  View Study Plan
                </Button>
              </div>
            </Card>
          </div>

          {/* ── Recent Activity ── */}
          <Card>
            <h2 className="dash-section-title">Recent Activity</h2>
            {/* TODO(Phase R): Replace this visual placeholder with dashboard analytics aggregation API. */}
            {MOCK_ACTIVITIES.map((activity) => (
              <div key={activity.id} className="dash-activity-item">
                <div className={`dash-activity-dot dash-activity-dot--${activity.type.split(' ')[0]}`} />
                <div className="dash-activity-info">
                  <p className="dash-activity-title">{activity.title}</p>
                  <p className="dash-activity-meta">
                    {activity.type} &middot; {activity.durationMinutes}m &middot;{' '}
                    {new Date(activity.date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                {activity.score != null && <span className="dash-activity-score">{activity.score}</span>}
                <Badge
                  variant={
                    activity.score != null && activity.score >= 75
                      ? 'success'
                      : activity.score != null && activity.score < 70
                        ? 'warning'
                        : 'default'
                  }
                >
                  {activity.score != null ? `${activity.score}` : activity.type}
                </Badge>
              </div>
            ))}
          </Card>
        </Container>
      </main>
    </>
  );
}
