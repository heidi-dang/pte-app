import { Container, Card } from '@pte-app/design-system';
import { MOCK_INVOICES } from '@/lib/mock-data';

export const metadata = {
  title: 'Invoices — PTE Academy',
  description: 'Your PTE Academy invoices.',
};

export default function InvoicesPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Invoices</h1>
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
                    <td className="ds-table__td">{invoice.status}</td>
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
