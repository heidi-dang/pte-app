

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ src, alt = '', initials = '?', size = 'md', className = '' }: AvatarProps) {
  const sizeClass = `ds-avatar--${size}`;
  return (
    <div className={`ds-avatar ${sizeClass} ${className}`} aria-label={alt || undefined} role="img">
      {src ? <img src={src} alt={alt} className="ds-avatar__image" /> : <span className="ds-avatar__initials">{initials}</span>}
    </div>
  );
}

export interface AvatarGroupProps {
  avatars: Array<{ src?: string | null; initials?: string; alt?: string }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ avatars, max = 3, size = 'sm' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;
  return (
    <div className="ds-avatar-group">
      {visible.map((a, i) => (
        <Avatar key={i} src={a.src} initials={a.initials || '?'} alt={a.alt} size={size} />
      ))}
      {remaining > 0 && (
        <div className={`ds-avatar ds-avatar--${size} ds-avatar--more`}>+{remaining}</div>
      )}
    </div>
  );
}
