import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({ columns, data, onRowClick, emptyMessage = 'No data found' }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  if (data.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-text-muted text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-theme">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`px-5 py-4 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider ${
                    col.sortable !== false ? 'cursor-pointer hover:text-text-primary select-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={14} className="stroke-[2.5]" /> : <ChevronDown size={14} className="stroke-[2.5]" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-theme">
            {sorted.map((item, i) => (
              <tr
                key={(item as any).id || i}
                onClick={() => onRowClick?.(item)}
                className={`transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer hover:bg-bg-elevated' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4 text-[13px] text-text-primary font-medium whitespace-nowrap">
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
