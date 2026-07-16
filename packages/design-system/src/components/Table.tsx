import type { ReactNode, TableHTMLAttributes } from 'react';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  width?: string;
}

export interface TableProps<T> extends TableHTMLAttributes<HTMLTableElement> {
  columns: TableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: ReactNode;
  className?: string;
}

export function Table<T>({ columns, rows, keyExtractor, emptyMessage, className = '', ...rest }: TableProps<T>) {
  return (
    <div className="ds-table-wrapper">
      <table className={`ds-table ${className}`} {...rest}>
        <thead className="ds-table__head">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="ds-table__th" style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="ds-table__body">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="ds-table__empty">
                {emptyMessage || 'No data available.'}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={keyExtractor(row)} className="ds-table__row">
                {columns.map((col) => (
                  <td key={col.key} className="ds-table__td">
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
