import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="ds-empty-state">
      {icon && <div className="ds-empty-state__icon">{icon}</div>}
      <h3 className="ds-empty-state__title">{title}</h3>
      {description && <p className="ds-empty-state__desc">{description}</p>}
      {action && <div className="ds-empty-state__action">{action}</div>}
    </div>
  );
}
