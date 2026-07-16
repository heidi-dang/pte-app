import { Container, Card, Badge, Button } from '@pte-app/design-system';

export const metadata = {
  title: 'Media Library — PTE Academy',
  description: 'Manage media assets for lessons and questions.',
};

export default function MediaLibraryPage() {
  const media = [
    { id: 'm1', name: 'intro-video.mp4', type: 'Video', size: '24 MB', status: 'ready' },
    { id: 'm2', name: 'sample-audio.mp3', type: 'Audio', size: '3 MB', status: 'ready' },
    { id: 'm3', name: 'slides.pdf', type: 'Document', size: '1 MB', status: 'ready' },
  ];

  return (
    <main>
      <Container>
        <div className="app-page-header">
          <h1 className="app-page-header__title">Media library</h1>
          <Button>Upload</Button>
        </div>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Name</th>
                  <th className="ds-table__th">Type</th>
                  <th className="ds-table__th">Size</th>
                  <th className="ds-table__th">Status</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {media.map((item) => (
                  <tr key={item.id} className="ds-table__row">
                    <td className="ds-table__td">{item.name}</td>
                    <td className="ds-table__td">{item.type}</td>
                    <td className="ds-table__td">{item.size}</td>
                    <td className="ds-table__td">
                      <Badge variant="success">{item.status}</Badge>
                    </td>
                    <td className="ds-table__td">
                      <Button size="sm">Preview</Button>
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
