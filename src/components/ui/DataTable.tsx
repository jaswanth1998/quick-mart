'use client';

import React, { useState } from 'react';
import { Search, Download, Plus, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import dayjs, { Dayjs } from 'dayjs';
import { useToast } from '@/components/ui/Toast';

export interface DataTableColumn<T> {
  dataIndex: string;
  title: string;
  key?: string;
  width?: number | string;
  ellipsis?: boolean;
  fixed?: 'left' | 'right';
  exportable?: boolean;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  sorter?: (a: T, b: T) => number;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  search?: {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
  };
  dateFilter?: {
    value?: [Dayjs, Dayjs];
    onChange?: (dates: [Dayjs, Dayjs] | null) => void;
  };
  actions?: {
    onAdd?: () => void;
    onDelete?: (record: T) => void;
    onExport?: () => void;
    addLabel?: string;
    deleteLabel?: string;
    exportLabel?: string;
  };
  exportFileName?: string;
  title?: string;
  rowKey?: string | ((record: T) => string);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  search,
  dateFilter,
  actions,
  exportFileName = 'export',
  title,
  rowKey = 'id',
}: DataTableProps<T>) {
  const toast = useToast();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleExport = () => {
    try {
      const exportableColumns = columns.filter((col) => col.exportable !== false);
      const exportData = data.map((record) => {
        const row: Record<string, unknown> = {};
        exportableColumns.forEach((col) => {
          const value = record[col.dataIndex];
          row[col.title] = value !== null && value !== undefined ? value : '';
        });
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
      XLSX.writeFile(wb, `${exportFileName}_${timestamp}.xlsx`);
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const handleSort = (col: DataTableColumn<T>) => {
    if (!col.sorter) return;
    if (sortKey === col.dataIndex) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(col.dataIndex);
      setSortDir('asc');
    }
  };

  // Sort data
  const sortedData = [...data];
  if (sortKey) {
    const col = columns.find((c) => c.dataIndex === sortKey);
    if (col?.sorter) {
      sortedData.sort((a, b) => {
        const result = col.sorter!(a, b);
        return sortDir === 'desc' ? -result : result;
      });
    }
  }

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(record);
    return String(record[rowKey] ?? index);
  };

  // Build columns including action column
  const tableColumns = [...columns];
  if (actions?.onDelete) {
    tableColumns.push({
      title: 'Actions',
      key: 'actions',
      dataIndex: 'actions',
      exportable: false,
      width: 100,
      render: (_, record) => (
        <button
          onClick={() => actions.onDelete?.(record)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {actions.deleteLabel || 'Delete'}
        </button>
      ),
    });
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 0;

  return (
    <div className="card">
      {/* Header */}
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
      )}

      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {search && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={search.placeholder || 'Search...'}
                value={search.value || ''}
                onChange={(e) => search.onChange?.(e.target.value)}
                className="input pl-9 w-64"
              />
            </div>
          )}

          {dateFilter && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFilter.value?.[0]?.format('YYYY-MM-DD') || ''}
                onChange={(e) => {
                  if (e.target.value && dateFilter.value?.[1]) {
                    dateFilter.onChange?.([dayjs(e.target.value), dateFilter.value[1]]);
                  }
                }}
                className="input w-40"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={dateFilter.value?.[1]?.format('YYYY-MM-DD') || ''}
                onChange={(e) => {
                  if (e.target.value && dateFilter.value?.[0]) {
                    dateFilter.onChange?.([dateFilter.value[0], dayjs(e.target.value)]);
                  }
                }}
                className="input w-40"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions?.onAdd && (
            <button className="btn-primary" onClick={actions.onAdd}>
              <Plus className="w-4 h-4" />
              {actions.addLabel || 'Add New'}
            </button>
          )}
          <button
            className="btn-secondary"
            onClick={actions?.onExport || handleExport}
            disabled={!data || data.length === 0}
          >
            <Download className="w-4 h-4" />
            {actions?.exportLabel || 'Export'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              {tableColumns.map((col) => (
                <th
                  key={col.key || col.dataIndex}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap
                    ${col.sorter ? 'cursor-pointer select-none hover:text-gray-700 group' : ''}
                  `}
                  style={col.width ? { width: typeof col.width === 'number' ? `${col.width}px` : col.width, minWidth: typeof col.width === 'number' ? `${col.width}px` : col.width } : undefined}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.title}
                    {col.sorter && (
                      <span className="text-gray-300 group-hover:text-gray-500">
                        {sortKey === col.dataIndex ? (
                          sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={tableColumns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={tableColumns.length} className="px-4 py-12 text-center text-gray-500 text-sm">
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((record, rowIndex) => (
                <tr
                  key={getRowKey(record, rowIndex)}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  {tableColumns.map((col) => (
                    <td
                      key={col.key || col.dataIndex}
                      className={`px-4 py-3 text-sm text-gray-700 ${col.ellipsis ? 'truncate max-w-[200px]' : ''}`}
                    >
                      {col.render
                        ? col.render(record[col.dataIndex], record, rowIndex)
                        : record[col.dataIndex] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            Showing {((pagination.current - 1) * pagination.pageSize) + 1}-{Math.min(pagination.current * pagination.pageSize, pagination.total)} of {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onChange(1, Number(e.target.value))}
              className="select w-auto text-sm py-1.5"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>{size} / page</option>
              ))}
            </select>
            <div className="flex items-center">
              <button
                onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
                disabled={pagination.current <= 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.current <= 3) {
                  pageNum = i + 1;
                } else if (pagination.current >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = pagination.current - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.onChange(pageNum, pagination.pageSize)}
                    className={`px-3 py-1.5 text-sm border-t border-b border-r border-gray-300 transition-colors
                      ${pagination.current === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}
                    `}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
                disabled={pagination.current >= totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
