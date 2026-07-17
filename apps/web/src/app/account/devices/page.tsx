import { Container, Card, Badge, Button } from '@pte-app/design-system';

export const metadata = {
  title: 'Devices — PTE Academy',
  description: 'Manage your connected devices.',
};

export default function DevicesPage() {
  const devices = [
    { id: 'd1', name: 'Chrome on Windows', lastActive: '2026-07-16 09:00', current: true },
    { id: 'd2', name: 'Safari on iPhone', lastActive: '2026-07-15 18:30', current: false },
    { id: 'd3', name: 'Firefox on macOS', lastActive: '2026-07-10 14:20', current: false },
  ];

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Devices
        </h1>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Device</th>
                  <th className="ds-table__th">Last active</th>
                  <th className="ds-table__th">Status</th>
                  <th className="ds-table__th">Actions</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {devices.map((device) => (
                  <tr key={device.id} className="ds-table__row">
                    <td className="ds-table__td">{device.name}</td>
                    <td className="ds-table__td">{device.lastActive}</td>
                    <td className="ds-table__td">
                      {device.current ? <Badge variant="success">Current</Badge> : <Badge>Inactive</Badge>}
                    </td>
                    <td className="ds-table__td">
                      {!device.current && (
                        <Button size="sm" variant="danger">
                          Revoke
                        </Button>
                      )}
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
