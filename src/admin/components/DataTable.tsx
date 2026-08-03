import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface Column<T = Record<string, unknown>> {
  key?: string;
  label?: string;
  // Legacy aliases used by admin pages
  header?: string;
  accessor?: string | ((row: T) => React.ReactNode);
  // Render function (takes precedence over accessor)
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (row: T) => void;
  keyField?: string;
  rowActions?: (row: T) => React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon = <Inbox className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />,
  onRowClick,
  keyField = 'id',
  rowActions,
  searchable = false,
  searchPlaceholder = 'Search...',
  pagination = false,
  pageSize = 10
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchable && search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(row => 
        Object.values(row).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch)
        )
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, search, sortConfig, searchable]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = pagination 
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData;

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="w-full flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all dark:text-white"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              {columns.map((col, cIdx) => (
                <th
                  key={col.key ?? col.header ?? cIdx}
                  style={{ width: col.width }}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-gray-900 dark:hover:text-white' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key ?? col.header ?? '')}
                >
                  <div className="flex items-center gap-1">
                    {col.label ?? col.header}
                    {col.sortable && sortConfig?.key === (col.key ?? col.header) && (
                      sortConfig?.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              {rowActions && <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-3/4 skeleton" />
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-6 py-4">
                      <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse ml-auto skeleton" />
                    </td>
                  )}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    {emptyIcon}
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr 
                  key={row[keyField as keyof T] as string || rIdx}
                  onClick={() => onRowClick?.(row)}
                  className={`group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, cIdx) => {
                    const colKey = col.key ?? col.header ?? '';
                    const cellValue = row[colKey as keyof T];
                    let content: React.ReactNode;
                    if (col.render) {
                      content = col.render(cellValue, row);
                    } else if (typeof col.accessor === 'function') {
                      content = col.accessor(row);
                    } else if (typeof col.accessor === 'string') {
                      content = row[col.accessor as keyof T] as React.ReactNode;
                    } else {
                      content = cellValue as React.ReactNode;
                    }
                    return (
                      <td key={colKey || cIdx} className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {content}
                      </td>
                    );
                  })}
                  {rowActions && (
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && !loading && filteredData.length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
