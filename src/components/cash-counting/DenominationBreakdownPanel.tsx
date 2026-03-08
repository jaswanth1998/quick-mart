'use client';

import { calculateDenominationBreakdown } from '@/lib/cash-counting-utils';
import type { CashCountingEntry } from '@/lib/cash-counting-utils';

interface DenominationBreakdownPanelProps {
  entries: CashCountingEntry[];
}

export default function DenominationBreakdownPanel({ entries }: DenominationBreakdownPanelProps) {
  const breakdown = calculateDenominationBreakdown(entries);
  const grandTotal = breakdown.reduce((sum, d) => sum + d.totalValue, 0);

  return (
    <div className="card sticky top-24">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Denomination Breakdown</h3>
        <p className="text-sm text-gray-500 mt-0.5">Cash distribution by denomination</p>
      </div>

      <div className="p-6">
        {breakdown.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No data available</p>
        ) : (
          <div className="space-y-4">
            {/* Grand Total */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm font-medium text-blue-700">Total Value</p>
              <p className="text-2xl font-bold text-blue-900">${grandTotal.toFixed(2)}</p>
            </div>

            {/* Individual Denominations */}
            <div className="space-y-3">
              {breakdown.map((denom) => (
                <div key={denom.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-12 h-8 rounded ${
                        denom.type === 'bill' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      } text-xs font-bold`}>
                        {denom.label}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {denom.totalCount} {denom.totalCount === 1 ? 'unit' : 'units'}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${denom.totalValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {denom.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        denom.type === 'bill' ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${denom.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
