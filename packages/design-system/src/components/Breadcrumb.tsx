

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`ds-breadcrumb ${className}`}>
      <ol className="ds-breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="ds-breadcrumb__item">
              {isLast || !item.href ? (
                <span className={`ds-breadcrumb__link ${isLast ? 'ds-breadcrumb__link--current' : ''}`} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <a className="ds-breadcrumb__link" href={item.href}>{item.label}</a>
              )}
              {!isLast && <span className="ds-breadcrumb__separator" aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
