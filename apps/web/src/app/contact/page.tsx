'use client';

import { useState } from 'react';
import { Container, Card, Button, Input, TextArea, Alert } from '@pte-app/design-system';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <main>
      <Container>
        <div className="landing__section-header">
          <h1 className="landing__section-title">Contact us</h1>
          <p className="landing__section-subtitle">Have a question? We would love to hear from you.</p>
        </div>
        <div className="status-grid">
          <Card>
            <h3 className="landing__feature-title">Email</h3>
            <p className="landing__feature-desc">support@pte.academy</p>
          </Card>
          <Card>
            <h3 className="landing__feature-title">Office hours</h3>
            <p className="landing__feature-desc">Monday – Friday, 9:00 AM – 6:00 PM AEDT</p>
          </Card>
          <Card>
            <h3 className="landing__feature-title">Location</h3>
            <p className="landing__feature-desc">Sydney, Australia · Remote-first team</p>
          </Card>
        </div>
        <Card style={{ maxWidth: '48rem', margin: '2rem auto 0' }}>
          {sent ? (
            <Alert>Thank you for your message. We will respond within 24 business hours.</Alert>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <Input label="Name" name="name" required />
              <Input label="Email" name="email" type="email" required />
              <TextArea label="Message" name="message" required />
              <Button type="submit">Send message</Button>
            </form>
          )}
        </Card>
      </Container>
    </main>
  );
}
