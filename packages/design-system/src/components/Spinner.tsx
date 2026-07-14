export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return <span className={`ds-spinner ds-spinner--${size} ${className}`} aria-label="Loading" />;
}
