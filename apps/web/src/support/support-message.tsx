'use client';
import React from 'react';
interface Props {
  onSend: (body: string) => void;
  sending?: boolean;
}
export function SupportMessageComposer({ onSend, sending }: Props) {
  const [body, setBody] = React.useState('');
  return (
    <section aria-label="Send message">
      <textarea value={body} onChange={(e) => setBody(e.target.value)} aria-label="Message" />
      <button
        onClick={() => {
          onSend(body);
          setBody('');
        }}
        disabled={sending || !body.trim()}
      >
        {sending ? 'Sending...' : 'Send'}
      </button>
    </section>
  );
}
