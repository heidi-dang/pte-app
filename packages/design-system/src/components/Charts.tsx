export interface ChartBarProps {
  data: Array<{ label: string; value: number; color?: string }>;
  max?: number;
  className?: string;
  showValues?: boolean;
}

export function ChartBar({ data, max, className = '', showValues = true }: ChartBarProps) {
  const maximum = max ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={`ds-chart-bar ${className}`} role="img" aria-label="Bar chart">
      {data.map((item, i) => (
        <div key={i} className="ds-chart-bar__item">
          <div className="ds-chart-bar__track">
            <div
              className="ds-chart-bar__fill"
              style={{ height: `${Math.min((item.value / maximum) * 100, 100)}%`, backgroundColor: item.color }}
            />
          </div>
          <span className="ds-chart-bar__label">{item.label}</span>
          {showValues && <span className="ds-chart-bar__value">{item.value}</span>}
        </div>
      ))}
    </div>
  );
}

export interface ChartLineProps {
  data: Array<{ label: string; value: number }>;
  className?: string;
}

export function ChartLine({ data, className = '' }: ChartLineProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1 || 1)) * 100;
      const y = 100 - (d.value / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <div className={`ds-chart-line ${className}`}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="ds-chart-line__svg"
        role="img"
        aria-label="Line chart"
      >
        <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
        {data.map((d, i) => {
          const x = (i / (data.length - 1 || 1)) * 100;
          const y = 100 - (d.value / max) * 100;
          return <circle key={i} cx={x} cy={y} r="1.5" fill="currentColor" />;
        })}
      </svg>
      <div className="ds-chart-line__labels">
        {data.map((d, i) => (
          <span key={i} className="ds-chart-line__label">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface ChartDonutProps {
  segments: Array<{ label: string; value: number; color: string }>;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ChartDonut({ segments, size = 120, strokeWidth = 12, className = '' }: ChartDonutProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={`ds-chart-donut ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Donut chart">
        {segments.map((s, i) => {
          const dash = (s.value / total) * circumference;
          const segment = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += dash;
          return segment;
        })}
      </svg>
      <div className="ds-chart-donut__legend">
        {segments.map((s, i) => (
          <div key={i} className="ds-chart-donut__legend-item">
            <span className="ds-chart-donut__swatch" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
            <span className="ds-chart-donut__value">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
