import type { ReactNode } from 'react';
import { Card, Badge } from '@pte-app/design-system';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, children, className = '' }: PageHeaderProps) {
  return (
    <div className={`app-page-header ${className}`}>
      <div>
        <h1 className="app-page-header__title">{title}</h1>
        {subtitle && <p className="app-page-header__subtitle">{subtitle}</p>}
      </div>
      {children && <div className="app-page-header__actions">{children}</div>}
    </div>
  );
}

export interface SectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, children, className = '' }: SectionProps) {
  return (
    <section className={`app-section ${className}`}>
      {title && <h2 className="app-section__title">{title}</h2>}
      {children}
    </section>
  );
}

export interface StatGridProps {
  children: ReactNode;
  className?: string;
}

export function StatGrid({ children, className = '' }: StatGridProps) {
  return <div className={`app-stat-grid ${className}`}>{children}</div>;
}

export function StatusBadge({ status, label }: { status: 'ok' | 'warning' | 'error' | 'loading'; label?: string }) {
  const variant = status === 'ok' ? 'success' : status === 'warning' ? 'warning' : 'danger';
  const text =
    label ||
    (status === 'ok' ? 'Operational' : status === 'warning' ? 'Warning' : status === 'loading' ? 'Loading' : 'Error');
  return <Badge variant={variant}>{text}</Badge>;
}

export function InfoCard({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`app-info-card ${className}`}>
      {title && <h3 className="app-info-card__title">{title}</h3>}
      {children}
    </Card>
  );
}
