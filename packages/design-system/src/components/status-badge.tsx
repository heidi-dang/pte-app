import React from 'react';
import { colors } from '../tokens/colors.js';

type BadgeStatus = 'ok' | 'fail' | 'loading' | 'warning';

export interface StatusBadgeProps {
  readonly status: BadgeStatus;
  readonly label?: string;
}

const statusConfig: Record<BadgeStatus, { bg: string; fg: string; defaultLabel: string }> = {
  ok: { bg: colors.success[50], fg: colors.success[700], defaultLabel: '\u2713 Operational' },
  fail: { bg: colors.error[50], fg: colors.error[700], defaultLabel: '\u2717 Unreachable' },
  loading: { bg: colors.neutral[100], fg: colors.neutral[600], defaultLabel: '\u27f3 Checking...' },
  warning: { bg: colors.warning[50], fg: colors.warning[700], defaultLabel: '\u26a0 Warning' },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.125rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: config.bg,
        color: config.fg,
      }}
      role="status"
    >
      {label || config.defaultLabel}
    </span>
  );
}
