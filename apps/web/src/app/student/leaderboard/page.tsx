import { Container, Card, Badge, Avatar } from '@pte-app/design-system';
import { PageHeader } from '@/components/PageShell';
import { MOCK_STUDENTS } from '@/lib/mock-data';

export const metadata = {
  title: 'Leaderboard — PTE Academy',
  description: 'See how you rank against other PTE Academy students.',
};

export default function LeaderboardPage() {
  const sorted = [...MOCK_STUDENTS].sort((a, b) => b.estimatedScore - a.estimatedScore);

  return (
    <main>
      <Container>
        <PageHeader title="Leaderboard" subtitle="Top learners this month by estimated training score." />
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Rank</th>
                  <th className="ds-table__th">Student</th>
                  <th className="ds-table__th">Streak</th>
                  <th className="ds-table__th">Score</th>
                  <th className="ds-table__th">Plan</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {sorted.map((student, index) => (
                  <tr key={student.id} className="ds-table__row">
                    <td className="ds-table__td">{index + 1}</td>
                    <td className="ds-table__td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Avatar
                          initials={student.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                          size="sm"
                        />
                        <span>{student.name}</span>
                      </div>
                    </td>
                    <td className="ds-table__td">{student.streakDays} days</td>
                    <td className="ds-table__td">
                      <strong>{student.estimatedScore}</strong>
                    </td>
                    <td className="ds-table__td">
                      <Badge
                        variant={
                          student.plan === 'free' ? 'default' : student.plan === 'premium' ? 'warning' : 'success'
                        }
                      >
                        {student.plan}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Container>
    </main>
  );
}
