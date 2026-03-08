'use client';

import { useShiftReportForm } from './ShiftReportFormProvider';
import { AlertTriangle } from 'lucide-react';

export default function ValueStockTable() {
  const { state, dispatch } = useShiftReportForm();

  const totalStartCount = state.valueStockEntries.reduce(
    (sum, entry) => sum + entry.start_count,
    0
  );
  const totalAdded = state.valueStockEntries.reduce(
    (sum, entry) => sum + entry.added,
    0
  );
  const totalSold = state.valueStockEntries.reduce(
    (sum, entry) => sum + entry.sold,
    0
  );
  const totalEndCount = state.valueStockEntries.reduce(
    (sum, entry) => sum + entry.end_count,
    0
  );

  return (
    <div className="card">
      {/* Table title */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Value Stock Report</h2>
        <p className="text-sm text-gray-500 mt-0.5">Track denomination-based stock by shift</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Count</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Added</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sold</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">End Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {state.valueStockEntries.map((entry, index) => (
              <tr
                key={entry.amount_label}
                className={
                  entry.has_mismatch
                    ? 'bg-red-50 border-l-4 border-l-red-400'
                    : 'hover:bg-blue-50/30 transition-colors'
                }
              >
                {/* Amount */}
                <td className="px-6 py-3">
                  <span className="font-semibold text-sm text-gray-900">{entry.amount_label}</span>
                </td>

                {/* Start Count - auto-filled, read-only */}
                <td className="px-4 py-3 text-center bg-gray-50/50">
                  <span className="text-sm text-gray-500 font-medium">{entry.start_count}</span>
                </td>

                {/* Added */}
                <td className="px-4 py-2 text-center">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="input text-center w-20 py-2 text-sm font-medium"
                    value={entry.added || ''}
                    placeholder="0"
                    onChange={(e) =>
                      dispatch({
                        type: 'SET_VALUE_STOCK_ENTRY',
                        payload: {
                          index,
                          field: 'added',
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
                        type: 'SET_VALUE_STOCK_ENTRY',
                        payload: {
                          index,
                          field: 'sold',
                          value: e.target.value === '' ? 0 : parseInt(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </td>

                {/* End Count */}
                <td className="px-4 py-3 text-center">
                  {entry.has_mismatch ? (
                    <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-sm">
                      {entry.end_count}
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="font-semibold text-sm text-gray-900">{entry.end_count}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Footer total row */}
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50/80">
              <td className="px-6 py-3 text-sm font-bold text-gray-900">Total</td>
              <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{totalStartCount}</td>
              <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{totalAdded}</td>
              <td className="px-4 py-3 text-center text-sm font-bold text-gray-700">{totalSold}</td>
              <td className="px-4 py-3 text-center text-sm font-bold text-gray-900">{totalEndCount}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
