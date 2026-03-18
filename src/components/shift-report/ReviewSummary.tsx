'use client';

import { useShiftReportForm } from './ShiftReportFormProvider';
import { AlertTriangle, Printer } from 'lucide-react';

export default function ReviewSummary() {
  const { state } = useShiftReportForm();

  const valueStockTotal = state.valueStockEntries.reduce(
    (sum, entry) => sum + entry.end_count,
    0
  );

  const drawerTotalSold = state.drawerStockEntries.reduce(
    (sum, entry) => sum + entry.sold,
    0
  );

  const valueMismatches = state.valueStockEntries.filter((e) => e.has_mismatch);
  const drawerMismatches = state.drawerStockEntries.filter((e) => e.has_mismatch);
  const allMismatches = [
    ...valueMismatches.map((e) => `Value Stock "${e.amount_label}": expected ${e.end_count}, override ${e.end_count_override}`),
    ...drawerMismatches.map((e) => `Drawer #${e.drawer_number} "${e.contents}": expected ${e.closing}, override ${e.closing_override}`),
  ];

  return (
    <div className="print-section space-y-6">
      {/* Section 1: Shift Details */}
      <div className="card">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Shift Details</h2>
        </div>
        <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="label">Report Date</span>
            <p className="font-medium text-gray-900">{state.reportDate}</p>
          </div>
          <div>
            <span className="label">Shift Type</span>
            <p className="font-medium text-gray-900">{state.shiftType}</p>
          </div>
          <div>
            <span className="label">Shift Incharge</span>
            <p className="font-medium text-gray-900">{state.shiftIncharge || '-'}</p>
          </div>
          <div>
            <span className="label">Store Location</span>
            <p className="font-medium text-gray-900">{state.storeLocation || '-'}</p>
          </div>
        </div>
      </div>

      {/* Section 2: Value Stock Summary */}
      <div className="card">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Value Stock Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="text-left px-3 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-center px-2 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Start</th>
                <th className="text-center px-2 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Added</th>
                <th className="text-center px-2 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtracted</th>
                <th className="text-center px-2 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sold</th>
                <th className="text-center px-2 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {state.valueStockEntries.map((entry) => (
                <tr
                  key={entry.amount_label}
                  className={
                    entry.has_mismatch
                      ? 'bg-red-50 border-l-4 border-l-red-400'
                      : ''
                  }
                >
                  <td className="px-3 sm:px-6 py-3 text-sm font-semibold text-gray-900">{entry.amount_label}</td>
                  <td className="px-2 sm:px-4 py-3 text-sm text-center text-gray-600">{entry.start_count}</td>
                  <td className="px-2 sm:px-4 py-3 text-sm text-center text-gray-600">{entry.added}</td>
                  <td className="px-2 sm:px-4 py-3 text-sm text-center text-gray-600">{entry.subtracted}</td>
                  <td className="px-2 sm:px-4 py-3 text-sm text-center text-gray-600">{entry.sold}</td>
                  <td className="px-2 sm:px-4 py-3 text-sm text-center">
                    {entry.has_mismatch ? (
                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                        {entry.end_count}
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="font-semibold text-gray-900">{entry.end_count}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                <td className="px-3 sm:px-6 py-3 text-sm font-bold text-gray-900">Total</td>
                <td className="px-2 sm:px-4 py-3" />
                <td className="px-2 sm:px-4 py-3" />
                <td className="px-2 sm:px-4 py-3" />
                <td className="px-2 sm:px-4 py-3" />
                <td className="px-2 sm:px-4 py-3 text-sm text-center font-bold text-gray-900">{valueStockTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Summary fields */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <span className="label">Total D-Sales</span>
              <p className="font-medium text-gray-900">{state.totalDSales}</p>
            </div>
            <div>
              <span className="label">Total D-Payout</span>
              <p className="font-medium text-gray-900">{state.totalDPayout}</p>
            </div>
            <div>
              <span className="label">Shift Sales</span>
              <p className="font-medium text-gray-900">{state.shiftSales}</p>
            </div>
            <div>
              <span className="label">Shift Payout</span>
              <p className="font-medium text-gray-900">{state.shiftPayout}</p>
            </div>
            <div>
              <span className="label">Activated</span>
              <p className="font-medium text-gray-900">{state.activated}</p>
            </div>
          </div>
        </div>

        {/* Value notes */}
        {state.valueNotes && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
            <span className="label">Notes</span>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{state.valueNotes}</p>
          </div>
        )}
      </div>

      {/* Section 3: Drawer Stock Summary */}
      <div className="card">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Drawer Stock Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="text-left px-3 sm:px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Drawer #</th>
                <th className="text-left px-2 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contents</th>
                <th className="text-center px-2 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Opening</th>
                <th className="text-center px-2 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Addition</th>
                <th className="text-center px-2 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtraction</th>
                <th className="text-center px-2 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sold</th>
                <th className="text-center px-2 sm:px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Closing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {state.drawerStockEntries.map((entry) => (
                <tr
                  key={entry.drawer_number}
                  className={
                    entry.has_mismatch
                      ? 'bg-red-50 border-l-4 border-l-red-400'
                      : ''
                  }
                >
                  <td className="px-3 sm:px-6 py-3 text-sm font-medium text-gray-700">{entry.drawer_number}</td>
                  <td className="px-2 sm:px-4 py-3 text-sm font-semibold text-gray-900">{entry.contents}</td>
                  <td className="px-2 sm:px-4 py-3 text-sm text-center text-gray-600">{entry.opening}</td>
                  <td className="px-2 sm:px-4 py-3 text-sm text-center text-gray-600">{entry.addition}</td>
                  <td className="px-2 sm:px-4 py-3 text-sm text-center text-gray-600">{entry.subtraction}</td>
                  <td className="px-2 sm:px-4 py-3 text-sm text-center text-gray-600">{entry.sold}</td>
                  <td className="px-2 sm:px-4 py-3 text-sm text-center">
                    {entry.has_mismatch ? (
                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                        {entry.closing}
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="font-semibold text-gray-900">{entry.closing}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                <td className="px-3 sm:px-6 py-3 text-sm font-bold text-gray-900" colSpan={2}>Total</td>
                <td className="px-2 sm:px-4 py-3" />
                <td className="px-2 sm:px-4 py-3" />
                <td className="px-2 sm:px-4 py-3" />
                <td className="px-2 sm:px-4 py-3 text-sm text-center font-bold text-gray-700">{drawerTotalSold}</td>
                <td className="px-2 sm:px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Drawer notes */}
        {state.drawerNotes && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
            <span className="label">Notes</span>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{state.drawerNotes}</p>
          </div>
        )}
      </div>

      {/* Section 4: Alerts */}
      {allMismatches.length > 0 && (
        <div className="card border-l-4 border-l-red-400">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alerts ({allMismatches.length})
            </h2>
            <ul className="space-y-2">
              {allMismatches.map((msg, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Print button */}
      <div className="flex justify-end">
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" />
          Print Report
        </button>
      </div>
    </div>
  );
}
