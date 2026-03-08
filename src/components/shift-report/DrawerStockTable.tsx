'use client';

import { useState } from 'react';
import { useShiftReportForm } from './ShiftReportFormProvider';
import { Search, AlertTriangle } from 'lucide-react';

export default function DrawerStockTable() {
  const { state, dispatch } = useShiftReportForm();
  const [searchTerm, setSearchTerm] = useState('');

  // Build filtered entries with their original indices
  const filteredEntries = state.drawerStockEntries
    .map((entry, originalIndex) => ({ entry, originalIndex }))
    .filter(({ entry }) =>
      entry.contents.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const totalOpening = state.drawerStockEntries.reduce(
    (sum, entry) => sum + entry.opening,
    0
  );
  const totalAddition = state.drawerStockEntries.reduce(
    (sum, entry) => sum + entry.addition,
    0
  );
  const totalSold = state.drawerStockEntries.reduce(
    (sum, entry) => sum + entry.sold,
    0
  );
  const totalClosing = state.drawerStockEntries.reduce(
    (sum, entry) => sum + entry.closing,
    0
  );

  return (
    <div className="space-y-4">
      <div className="card">
        {/* Table title + search */}
        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Drawer Stock Report</h2>
            <p className="text-sm text-gray-500 mt-0.5">Track cigarette/product drawer stock by shift</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input pl-9 w-64"
              placeholder="Filter products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Drawer #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contents</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Opening</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Addition</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sold</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Closing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEntries.map(({ entry, originalIndex }) => (
                <tr
                  key={originalIndex}
                  className={
                    entry.has_mismatch
                      ? 'bg-red-50 border-l-4 border-l-red-400'
                      : 'hover:bg-blue-50/30 transition-colors'
                  }
                >
                  {/* Drawer # */}
                  <td className="px-6 py-3">
                    <span className="text-sm font-medium text-gray-700">{entry.drawer_number}</span>
                  </td>

                  {/* Contents */}
                  <td className="px-4 py-3">
                    <span className="font-semibold text-sm text-gray-900">{entry.contents}</span>
                  </td>

                  {/* Opening - auto-filled, read-only */}
                  <td className="px-4 py-3 text-center bg-gray-50/50">
                    <span className="text-sm text-gray-500 font-medium">{entry.opening}</span>
                  </td>

                  {/* Addition */}
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      className="input text-center w-20 py-2 text-sm font-medium"
                      value={entry.addition || ''}
                      placeholder="0"
                      onChange={(e) =>
                        dispatch({
                          type: 'SET_DRAWER_STOCK_ENTRY',
                          payload: {
                            index: originalIndex,
                            field: 'addition',
                            value: e.target.value === '' ? 0 : parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </td>

                  {/* Sold */}
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      className="input text-center w-20 py-2 text-sm font-medium"
                      value={entry.sold || ''}
                      placeholder="0"
                      onChange={(e) =>
                        dispatch({
                          type: 'SET_DRAWER_STOCK_ENTRY',
                          payload: {
                            index: originalIndex,
                            field: 'sold',
                            value: e.target.value === '' ? 0 : parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </td>

                  {/* Closing */}
                  <td className="px-4 py-3 text-center">
                    {entry.has_mismatch ? (
                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-sm">
                        {entry.closing}
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="font-semibold text-sm text-gray-900">{entry.closing}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Footer total row */}
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                <td className="px-6 py-3 text-sm font-bold text-gray-900" colSpan={2}>Total</td>
                <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{totalOpening}</td>
                <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{totalAddition}</td>
                <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{totalSold}</td>
                <td className="px-4 py-3 text-center text-sm font-bold text-gray-900">{totalClosing}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes - separate card */}
      <div className="card p-6">
        <label className="label">Drawer Stock Notes</label>
        <textarea
          className="input w-full"
          rows={3}
          placeholder="Add notes about drawer stock..."
          value={state.drawerNotes}
          onChange={(e) => dispatch({ type: 'SET_DRAWER_NOTES', payload: e.target.value })}
        />
      </div>
    </div>
  );
}
