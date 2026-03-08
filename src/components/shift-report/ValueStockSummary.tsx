'use client';

import { useShiftReportForm } from './ShiftReportFormProvider';

const SUMMARY_FIELDS = [
  { key: 'totalDSales' as const, label: 'Total D-Sales' },
  { key: 'totalDPayout' as const, label: 'Total D-Payout' },
  { key: 'shiftSales' as const, label: 'Shift Sales' },
  { key: 'shiftPayout' as const, label: 'Shift Payout' },
  { key: 'activated' as const, label: 'Activated' },
];

export default function ValueStockSummary() {
  const { state, dispatch } = useShiftReportForm();

  const computedTotal = state.valueStockEntries.reduce(
    (sum, entry) => sum + entry.end_count,
    0
  );

  return (
    <div className="card sticky top-24">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Shift Summary</h2>
      </div>

      <div className="p-6">
      {/* Computed Total */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <span className="label">Value Stock Total</span>
        <p className="text-2xl font-bold text-blue-700">{computedTotal}</p>
      </div>

      {/* Editable summary fields */}
      <div className="space-y-4">
        {SUMMARY_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="label">{field.label}</label>
            <input
              type="number"
              step="0.01"
              className="input w-full"
              value={state[field.key]}
              onChange={(e) =>
                dispatch({
                  type: 'SET_SUMMARY_FIELD',
                  payload: {
                    field: field.key,
                    value: isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value),
                  },
                })
              }
            />
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="mt-6">
        <label className="label">Notes</label>
        <textarea
          className="input w-full"
          rows={3}
          placeholder="Add notes about value stock..."
          value={state.valueNotes}
          onChange={(e) => dispatch({ type: 'SET_VALUE_NOTES', payload: e.target.value })}
        />
      </div>
      </div>
    </div>
  );
}
