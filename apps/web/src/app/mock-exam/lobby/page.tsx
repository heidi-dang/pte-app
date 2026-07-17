import { Container, Card, Button, Badge } from '@pte-app/design-system';

// TODO(Phase Q): Connect this visual mock-test setup to the real mock-exam engine when Phase Q backend is accepted.

export const metadata = {
  title: 'Mock Exam Center — PTE Academy',
  description: 'Configure and start a full-length PTE Academic mock exam.',
};

const TASK_TYPES = [
  { id: 'ra', label: 'Read Aloud', skill: 'Speaking', defaultOn: true },
  { id: 'rs', label: 'Repeat Sentence', skill: 'Speaking', defaultOn: true },
  { id: 'rl', label: 'Re-tell Lecture', skill: 'Speaking', defaultOn: true },
  { id: 'di', label: 'Describe Image', skill: 'Speaking', defaultOn: true },
  { id: 'sst', label: 'Summarise Spoken Text', skill: 'Listening', defaultOn: true },
  { id: 'swt', label: 'Summarise Written Text', skill: 'Writing', defaultOn: true },
  { id: 'we', label: 'Write Essay', skill: 'Writing', defaultOn: true },
  { id: 'mcq', label: 'Multiple Choice', skill: 'Reading', defaultOn: true },
  { id: 'fib', label: 'Fill in the Blanks', skill: 'Reading', defaultOn: true },
  { id: 'hwp', label: 'Highlight Wrong Words', skill: 'Listening', defaultOn: true },
  { id: 'wfd', label: 'Write from Dictation', skill: 'Listening', defaultOn: true },
];

export default function ExamLobbyPage() {
  return (
    <main className="lobby">
      <Container>
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="lobby-header">
          <h1 className="lobby-title">Mock Exam Center</h1>
          <p className="lobby-subtitle">Simulate the real PTE Academic experience with a full-length timed exam</p>
        </div>

        <div className="lobby-layout">
          {/* ── Setup Panel ──────────────────────────────────────── */}
          <Card className="lobby-setup">
            <h2 className="lobby-section-title">Exam Setup</h2>

            <div className="lobby-form-group">
              <label className="lobby-label">Task Types</label>
              <p className="lobby-hint">Select which task types to include in your exam</p>
              <div className="lobby-toggle-grid">
                {TASK_TYPES.map((tt) => (
                  <div key={tt.id} className="lobby-toggle">
                    <div className="lobby-toggle-info">
                      <span className="lobby-toggle-name">{tt.label}</span>
                      <Badge variant="default">{tt.skill}</Badge>
                    </div>
                    <div className={`lobby-switch ${tt.defaultOn ? 'lobby-switch--on' : ''}`}>
                      <div className="lobby-switch-knob" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lobby-form-row">
              <div className="lobby-form-group lobby-form-group--half">
                <label className="lobby-label">Target Question Count</label>
                <div className="lobby-input-row">
                  <span className="lobby-input-value">22</span>
                  <span className="lobby-input-unit">questions</span>
                </div>
              </div>
              <div className="lobby-form-group lobby-form-group--half">
                <label className="lobby-label">Focus Topic</label>
                <div className="lobby-input-row">
                  <span className="lobby-input-placeholder">e.g. Environment, Technology...</span>
                </div>
              </div>
            </div>
          </Card>

          {/* ── Exam Summary ─────────────────────────────────────── */}
          <div className="lobby-sidebar">
            <Card className="lobby-summary-card">
              <h3 className="lobby-section-title">Exam Summary</h3>
              <ul className="lobby-summary-list">
                <li>
                  <span>Duration</span>
                  <strong>~2 hours</strong>
                </li>
                <li>
                  <span>Task types</span>
                  <strong>{TASK_TYPES.length}</strong>
                </li>
                <li>
                  <span>Total questions</span>
                  <strong>22</strong>
                </li>
                <li>
                  <span>AI scoring</span>
                  <Badge variant="success">Included</Badge>
                </li>
              </ul>
              <a href="/mock-exam/exam">
                <Button className="lobby-start-btn">Start Mock Exam</Button>
              </a>
              <p className="lobby-start-note">Do not refresh the page during the exam.</p>
            </Card>

            <Card className="lobby-info-card">
              <h3 className="lobby-section-title">System Checks</h3>
              <div className="lobby-checks">
                {[
                  { label: 'Browser', status: 'ok' },
                  { label: 'Microphone', status: 'ok' },
                  { label: 'Headphones', status: 'ok' },
                  { label: 'Camera', status: 'warn' },
                ].map((c) => (
                  <div key={c.label} className="lobby-check">
                    <span>{c.label}</span>
                    <Badge variant={c.status === 'ok' ? 'success' : 'warning'}>
                      {c.status === 'ok' ? 'Ready' : 'Optional'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Container>

      <style>{`
        .lobby {
          min-height: 100vh;
          padding: 3rem 0 4rem;
          background: var(--color-bg, #0a0f1a);
        }

        .lobby-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .lobby-title {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #2dd4bf 0%, #5eead4 50%, #99f6e4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.75rem;
        }

        .lobby-subtitle {
          font-size: 1.125rem;
          color: var(--color-muted, #94a3b8);
          max-width: 36rem;
          margin: 0 auto;
          line-height: 1.6;
        }

        .lobby-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 900px) {
          .lobby-layout {
            grid-template-columns: 1fr;
          }
        }

        /* ── Setup Panel ──────────────────────────── */
        .lobby-setup {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(45, 212, 191, 0.1) !important;
          border-radius: 1rem !important;
          padding: 1.75rem !important;
        }

        .lobby-section-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-text, #f1f5f9);
          margin: 0 0 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(45, 212, 191, 0.08);
        }

        .lobby-form-group {
          margin-bottom: 1.5rem;
        }

        .lobby-form-row {
          display: flex;
          gap: 1.5rem;
        }

        .lobby-form-group--half {
          flex: 1;
        }

        .lobby-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text, #e2e8f0);
          margin-bottom: 0.375rem;
        }

        .lobby-hint {
          font-size: 0.8rem;
          color: var(--color-muted, #94a3b8);
          margin: 0 0 1rem;
        }

        /* ── Toggle Grid ──────────────────────────── */
        .lobby-toggle-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        @media (max-width: 640px) {
          .lobby-toggle-grid {
            grid-template-columns: 1fr;
          }
        }

        .lobby-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.625rem 0.875rem;
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(45, 212, 191, 0.06);
          border-radius: 0.625rem;
          transition: border-color 0.15s ease;
        }

        .lobby-toggle:hover {
          border-color: rgba(45, 212, 191, 0.15);
        }

        .lobby-toggle-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .lobby-toggle-name {
          font-size: 0.85rem;
          color: var(--color-text, #e2e8f0);
        }

        .lobby-switch {
          width: 2.25rem;
          height: 1.25rem;
          background: rgba(51, 65, 85, 0.6);
          border-radius: 9999px;
          padding: 2px;
          cursor: pointer;
          transition: background 0.2s ease;
          flex-shrink: 0;
        }

        .lobby-switch--on {
          background: #0d9488;
        }

        .lobby-switch-knob {
          width: 1rem;
          height: 1rem;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }

        .lobby-switch--on .lobby-switch-knob {
          transform: translateX(1rem);
        }

        /* ── Input Rows ───────────────────────────── */
        .lobby-input-row {
          padding: 0.625rem 0.875rem;
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(45, 212, 191, 0.08);
          border-radius: 0.625rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .lobby-input-value {
          font-size: 1rem;
          font-weight: 700;
          color: #2dd4bf;
          font-variant-numeric: tabular-nums;
        }

        .lobby-input-unit {
          font-size: 0.8rem;
          color: var(--color-muted, #94a3b8);
        }

        .lobby-input-placeholder {
          font-size: 0.85rem;
          color: var(--color-muted, #64748b);
        }

        /* ── Sidebar ──────────────────────────────── */
        .lobby-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .lobby-summary-card {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(45, 212, 191, 0.1) !important;
          border-radius: 1rem !important;
          padding: 1.5rem !important;
        }

        .lobby-summary-list {
          list-style: none;
          margin: 0 0 1.5rem;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .lobby-summary-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: var(--color-text, #cbd5e1);
        }

        .lobby-summary-list li strong {
          color: #2dd4bf;
        }

        .lobby-start-btn {
          width: 100%;
          font-size: 1rem !important;
          padding: 0.875rem !important;
          background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%) !important;
          border: none !important;
          font-weight: 700 !important;
        }

        .lobby-start-btn:hover {
          background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%) !important;
        }

        .lobby-start-note {
          font-size: 0.75rem;
          color: var(--color-muted, #64748b);
          text-align: center;
          margin-top: 0.75rem;
        }

        .lobby-info-card {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(45, 212, 191, 0.08) !important;
          border-radius: 1rem !important;
          padding: 1.25rem !important;
        }

        .lobby-checks {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .lobby-check {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: var(--color-text, #cbd5e1);
          padding: 0.5rem 0.75rem;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 0.5rem;
        }
      `}</style>
    </main>
  );
}
