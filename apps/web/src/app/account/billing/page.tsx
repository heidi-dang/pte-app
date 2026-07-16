import { Container, Card, Button, Badge } from '@pte-app/design-system';
import { MOCK_INVOICES } from '@/lib/mock-data';

export const metadata = {
  title: 'Billing — PTE Academy',
  description: 'Manage your billing information.',
};

export default function BillingPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Billing
        </h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="app-info-card__title">Current plan</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>Premium</p>
            <p className="landing__feature-desc">$29.99/month · Next billing: 1 Aug 2026</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="secondary" size="sm">
                Update payment
              </Button>
              <Button variant="secondary" size="sm">
                Cancel
              </Button>
            </div>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Payment method</h3>
            <p className="landing__feature-desc">Visa ending in 4242 · Expires 12/28</p>
            <Button variant="secondary" size="sm" style={{ marginTop: '1rem' }}>
              Change
            </Button>
          </Card>
        </div>
        <h2 className="app-section__title" style={{ marginTop: '2rem' }}>
          Invoices
        </h2>
        <Card>
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead className="ds-table__head">
                <tr>
                  <th className="ds-table__th">Invoice</th>
                  <th className="ds-table__th">Date</th>
                  <th className="ds-table__th">Plan</th>
                  <th className="ds-table__th">Amount</th>
                  <th className="ds-table__th">Status</th>
                </tr>
              </thead>
              <tbody className="ds-table__body">
                {MOCK_INVOICES.map((invoice) => (
                  <tr key={invoice.id} className="ds-table__row">
                    <td className="ds-table__td">{invoice.id}</td>
                    <td className="ds-table__td">{invoice.date}</td>
                    <td className="ds-table__td">{invoice.plan}</td>
                    <td className="ds-table__td">${invoice.amount}</td>
                    <td className="ds-table__td">
                      <Badge
                        variant={
                          invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'danger'
                        }
                      >
                        {invoice.status}
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
