import { Container, Card, Badge } from '@pte-app/design-system';

export const metadata = {
  title: 'Version History — PTE Academy',
  description: 'Track content versions.',
};

export default function VersionHistoryPage() {
  const versions = [
    { id: 'v3', item: 'PTE Academic Complete', author: 'Priya Nair', date: '2026-07-15', status: 'published' },
    { id: 'v2', item: 'Speaking Mastery', author: 'Dr. Sarah Chen', date: '2026-07-10', status: 'published' },
    { id: 'v1', item: 'Writing Foundations', author: 'James O’Connor', date: '2026-07-05', status: 'archived' },
  ];

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Version history
        </h1>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Version</th>
                  <th className="ds-table__th">Item</th>
                  <th className="ds-table__th">Author</th>
                  <th className="ds-table__th">Date</th>
                  <th className="ds-table__th">Status</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {versions.map((v) => (
                  <tr key={v.id} className="ds-table__row">
                    <td className="ds-table__td">{v.id}</td>
                    <td className="ds-table__td">{v.item}</td>
                    <td className="ds-table__td">{v.author}</td>
                    <td className="ds-table__td">{v.date}</td>
                    <td className="ds-table__td">
                      <Badge variant={v.status === 'published' ? 'success' : 'default'}>{v.status}</Badge>
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
