'use client';

import Link from 'next/link';
import { Coins, ArrowRight } from 'lucide-react';
import type { CashAccountabilityRow } from '@/hooks/useDashboard';

interface Props {
  data: CashAccountabilityRow[];
}

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CashAccountabilityCard({ data }: Props) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
        <Coins className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Cash Accountability</h3>
      </div>

      {data.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-gray-400">No cash counting entries for this period</p>
          <Link href="/cash-counting" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
            Go to Cash Counting <ArrowRight className="w-3 h-3 inline" />
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {data.map((row) => {
            const varianceAbs = Math.abs(row.variance);
            let varianceColor = 'text-green-600';
            let varianceBg = 'bg-green-50';
            if (row.variance < -1) {
              varianceColor = 'text-red-600';
              varianceBg = 'bg-red-50';
            } else if (row.variance > 1) {
              varianceColor = 'text-amber-600';
              varianceBg = 'bg-amber-50';
            }

            return (
              <div key={row.shiftType} className="px-5 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">Shift {row.shiftType}</span>
                  <span className={`badge ${row.variance < -1 ? 'badge-red' : row.variance > 1 ? 'badge-orange' : 'badge-green'}`}>
                    {row.variance >= 0 ? '+' : ''}{fmt(row.variance)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Counted</span>
                    <p className="font-medium text-gray-800">{fmt(row.totalCounted)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Sale Drops</span>
                    <p className="font-medium text-gray-800">{fmt(row.saleDrops)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Remaining</span>
                    <p className="font-medium text-gray-800">{fmt(row.remaining)}</p>
                  </div>
                  <div className={`rounded-md px-2 py-1 ${varianceBg}`}>
                    <span className="text-gray-500">Variance</span>
                    <p className={`font-medium ${varianceColor}`}>
                      {row.variance >= 0 ? '+' : '-'}{fmt(varianceAbs)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
