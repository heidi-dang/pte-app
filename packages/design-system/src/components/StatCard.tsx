import type { HTMLAttributes, ReactNode } from 'react';

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  trend?: { value: number; label: string; positive?: boolean };
  icon?: ReactNode;
  children?: ReactNode;
}

export function StatCard({ title, value, trend, icon, children, className = '', ...rest }: StatCardProps) {
  return (
    <div className={`ds-stat-card ${className}`} {...rest}>
      <div className="ds-stat-card__header">
        <div>
          <p className="ds-stat-card__title">{title}</p>
          <p className="ds-stat-card__value">{value}</p>
        </div>
        {icon && (
          <div className="ds-stat-card__icon" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={`ds-stat-card__trend ${trend.positive === false ? 'ds-stat-card__trend--negative' : ''}`}>
          <span className="ds-stat-card__trend-value">
            {trend.positive === false ? '↓' : '↑'} {Math.abs(trend.value)}%
          </span>
          <span className="ds-stat-card__trend-label">{trend.label}</span>
        </div>
      )}
      {children}
    </div>
  );
}
