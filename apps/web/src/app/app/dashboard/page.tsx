'use client';

export default function Dashboard() {
  const skills = [
    { name: 'Speaking', score: 68, color: 'hsl(221, 83%, 53%)', icon: '🗣️' },
    { name: 'Writing', score: 72, color: 'hsl(262, 83%, 58%)', icon: '✍️' },
    { name: 'Reading', score: 60, color: 'hsl(142, 72%, 29%)', icon: '📖' },
    { name: 'Listening', score: 65, color: 'hsl(38, 92%, 50%)', icon: '🎧' },
  ];

  const tasks = [
    { title: 'Read Aloud practice', duration: '15 mins', status: 'Completed', completed: true },
    { title: 'Describe Image exercise', duration: '20 mins', status: 'In progress', completed: false },
    { title: 'Fill in the Blanks quiz', duration: '10 mins', status: 'Pending', completed: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>Welcome Back, Jane!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Track your PTE Academic readiness and continue your study plan.
        </p>
      </div>

      {/* Grid of Skill Progress Card Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        {skills.map((skill) => (
          <div
            key={skill.name}
            className="premium-card"
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.5rem' }} role="img" aria-label={skill.name}>
                {skill.icon}
              </span>
              <span
                className="badge badge-success"
                style={{ background: 'rgba(37, 99, 235, 0.08)', color: 'var(--primary)' }}
              >
                Active
              </span>
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{skill.name}</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '0.25rem' }}>
                {skill.score}{' '}
                <span style={{ fontSize: '0.875rem', fontWeight: '400', color: 'var(--text-muted)' }}>/ 90</span>
              </p>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                background: 'var(--border-color)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div style={{ width: `${(skill.score / 90) * 100}%`, height: '100%', background: skill.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Panel splitting Study Schedule and Next Milestones */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Left: Study Plan Timeline */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Today's Study Plan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tasks.map((task, _idx) => (
              <div
                key={task.title}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'var(--bg-app)',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${task.completed ? 'var(--success)' : 'var(--primary)'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{task.completed ? '✅' : '⏳'}</span>
                  <div>
                    <p
                      style={{
                        fontWeight: '500',
                        fontSize: '0.95rem',
                        textDecoration: task.completed ? 'line-through' : 'none',
                      }}
                    >
                      {task.title}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Duration: {task.duration}</p>
                  </div>
                </div>
                <span className={`badge ${task.completed ? 'badge-success' : 'badge-warning'}`}>{task.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick actions and next exam */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="premium-card" style={{ background: 'var(--primary)', color: '#fff', border: 'none' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Mock Exam Ready</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '1.5rem' }}>
              Test your exam endurance with a realistic, timed 2-hour mock exam.
            </p>
            <button
              className="btn btn-secondary"
              style={{ background: '#fff', color: 'var(--primary)', width: '100%' }}
            >
              Start Exam 📝
            </button>
          </div>

          <div className="premium-card">
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem' }}>Target Score</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>79</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>PTE Points</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Exam Date: March 1, 2027
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
