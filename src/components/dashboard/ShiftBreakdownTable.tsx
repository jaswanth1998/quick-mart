'use client';

import { BarChart3 } from 'lucide-react';
import type { ShiftBreakdownRow } from '@/hooks/useDashboard';

interface Props {
  data: ShiftBreakdownRow[];
}

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

export default function ShiftBreakdownTable({ data }: Props) {
  const totals = data.reduce(
    (acc, r) => ({
      merchandise: acc.merchandise + r.merchandise,
      fuel: acc.fuel + r.fuel,
      safeDrops: acc.safeDrops + r.safeDrops,
      lotto: acc.lotto + r.lotto,
      payouts: acc.payouts + r.payouts,
    }),
    { merchandise: 0, fuel: 0, safeDrops: 0, lotto: 0, payouts: 0 },
  );

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Shift Breakdown</h3>
        </div>
        {data.length > 0 && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {data.length} shift{data.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Shift #</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Merchandise</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Fuel</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Safe Drops</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Lotto</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Payouts</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No transaction data for selected period
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const total = row.merchandise + row.fuel + row.safeDrops + row.lotto + row.payouts;
                return (
                  <tr key={row.shiftNumber} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm text-gray-500">{fmtDate(row.shiftDate)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.shiftNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{fmt(row.merchandise)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{fmt(row.fuel)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{fmt(row.safeDrops)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{fmt(row.lotto)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{fmt(row.payouts)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{fmt(total)}</td>
                  </tr>
                );
              })
            )}
            {data.length > 0 && (
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3 text-sm text-gray-900"></td>
                <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{fmt(totals.merchandise)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{fmt(totals.fuel)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{fmt(totals.safeDrops)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{fmt(totals.lotto)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{fmt(totals.payouts)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {fmt(totals.merchandise + totals.fuel + totals.safeDrops + totals.lotto + totals.payouts)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
