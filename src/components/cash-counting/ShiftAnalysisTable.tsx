'use client';

import { useState } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { getEntryStatus, calculateStats } from '@/lib/cash-counting-utils';
import type { CashCountingEntry, EntryStatus } from '@/lib/cash-counting-utils';
import { CASH_DENOMINATIONS } from '@/lib/cash-counting-constants';

interface ShiftAnalysisTableProps {
  entries: CashCountingEntry[];
  onView: (entry: CashCountingEntry) => void;
  onEdit: (entry: CashCountingEntry) => void;
  onDelete: (entry: CashCountingEntry) => void;
}

export default function ShiftAnalysisTable({
  entries,
  onView,
  onEdit,
  onDelete,
}: ShiftAnalysisTableProps) {
  const [sortField, setSortField] = useState<keyof CashCountingEntry>('entry_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const stats = calculateStats(entries);

  const handleSort = (field: keyof CashCountingEntry) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const getStatusBadge = (status: EntryStatus) => {
    const badges = {
      'Balanced': 'badge-green',
      'Needs Review': 'badge-orange',
      'High Remaining': 'badge-purple',
      'Low Drop': 'badge-red',
      'Mismatch': 'badge-red',
    };
    return badges[status];
  };

  const getRowColor = (status: EntryStatus) => {
    const colors = {
      'Balanced': '',
      'Needs Review': 'bg-orange-50',
      'High Remaining': 'bg-purple-50',
      'Low Drop': 'bg-red-50',
      'Mismatch': 'bg-red-50',
    };
    return colors[status];
  };

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Shift Analysis</h3>
        <p className="text-sm text-gray-500 mt-0.5">Detailed cash counting entries by shift</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="border-b-2 border-gray-200 bg-gray-50/80">
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('entry_date')}
              >
                Date {sortField === 'entry_date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Shift
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Incharge
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Location
              </th>
              {CASH_DENOMINATIONS.map((denom) => (
                <th
                  key={denom.key}
                  className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {denom.label}
                </th>
              ))}
              <th
                className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total_sale_drops')}
              >
                TSD {sortField === 'total_sale_drops' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total_amount')}
              >
                TM {sortField === 'total_amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('sale_drop')}
              >
                SD {sortField === 'sale_drop' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('remaining')}
              >
                RM {sortField === 'remaining' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedEntries.length === 0 ? (
              <tr>
                <td colSpan={16} className="px-6 py-12 text-center text-gray-500">
                  No entries found
                </td>
              </tr>
            ) : (
              sortedEntries.map((entry) => {
                const status = getEntryStatus(entry, stats.meanRemaining, stats.stdDevRemaining);
                return (
                  <tr
                    key={entry.id}
                    className={`${getRowColor(status)} hover:bg-gray-50/50 transition-colors`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {entry.entry_date}
                    </td>
                    <td className="px-2 py-3 text-sm text-center text-gray-600">
                      {entry.shift_type}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entry.shift_incharge}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entry.store_location}
                    </td>
                    {CASH_DENOMINATIONS.map((denom) => (
                      <td
                        key={denom.key}
                        className="px-2 py-3 text-sm text-center text-gray-600 font-mono"
                      >
                        {entry[denom.key]}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      ${entry.total_sale_drops.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      ${entry.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      ${entry.sale_drop.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      ${entry.remaining.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`${getStatusBadge(status)} text-xs`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          onClick={() => onView(entry)}
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          onClick={() => onEdit(entry)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          type="button"
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          onClick={() => onDelete(entry)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
