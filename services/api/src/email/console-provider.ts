import type { EmailMessage, EmailProvider } from './provider.js';

/**
 * Console email provider — for local development only.
 * Prints the email to stdout instead of dispatching to an SMTP server.
 */
export class ConsoleEmailProvider implements EmailProvider {
  async send(msg: EmailMessage): Promise<void> {
    console.log('─'.repeat(60));
    console.log(`[EMAIL] To: ${msg.to}`);
    console.log(`[EMAIL] Subject: ${msg.subject}`);
    console.log(`[EMAIL] Body:\n${msg.text}`);
    console.log('─'.repeat(60));
  }
}
