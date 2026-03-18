'use client';

import { VALUE_STOCK_ROWS, DRAWER_STOCK_ROWS } from '@/lib/shift-report-constants';
import type { ShiftType } from '@/lib/shift-report-constants';
import { usePreviousShiftClosing } from '@/hooks/useShiftReports';
import { useStockAdditionsForShift } from '@/hooks/useStockAdditions';
import { useStockSubtractionsForShift } from '@/hooks/useStockSubtractions';
import { Loader2 } from 'lucide-react';

interface CurrentStockCardProps {
  date: string;
  shiftType: ShiftType;
  storeLocation: string;
  stockType: 'value' | 'drawer';
}

export default function CurrentStockCard({ date, shiftType, storeLocation, stockType }: CurrentStockCardProps) {
  const { data: previousClosing, isLoading: loadingClosing } = usePreviousShiftClosing(date, shiftType, storeLocation);
  const { data: additionsData, isLoading: loadingAdded } = useStockAdditionsForShift(date, shiftType, storeLocation);
  const { data: subtractionsData, isLoading: loadingSub } = useStockSubtractionsForShift(date, shiftType, storeLocation);

  const isLoading = loadingClosing || loadingAdded || loadingSub;

  const items = stockType === 'value'
    ? VALUE_STOCK_ROWS.map((r) => r.label)
    : DRAWER_STOCK_ROWS.map((r) => r.contents);

  const closingMap = stockType === 'value'
    ? previousClosing?.valueStockClosing
    : previousClosing?.drawerStockClosing;

  const addedMap = stockType === 'value'
    ? additionsData?.valueAdded
    : additionsData?.drawerAdded;

  const subtractedMap = stockType === 'value'
    ? subtractionsData?.valueSubtracted
    : subtractionsData?.drawerSubtracted;

  if (isLoading) {
    return (
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Current Stock</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  const stockRows = items.map((item) => {
    const base = closingMap?.[item] ?? 0;
    const added = addedMap?.[item] ?? 0;
    const subtracted = subtractedMap?.[item] ?? 0;
    const current = base + added - subtracted;
    return { item, base, added, subtracted, current };
  });

  const hasAnyStock = stockRows.some((r) => r.current !== 0 || r.base !== 0);

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Current Stock</h3>
        <p className="text-xs text-gray-500 mt-0.5">Previous closing + added - subtracted this shift</p>
      </div>
      {!hasAnyStock ? (
        <div className="px-6 py-4 text-sm text-gray-400 text-center">No stock data from previous shifts</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prev Close</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-green-600 uppercase tracking-wider">+ Added</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-red-600 uppercase tracking-wider">- Subtracted</th>
                <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stockRows.map((row) => (
                <tr key={row.item} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{row.item}</td>
                  <td className="px-3 py-2 text-sm text-center text-gray-500">{row.base}</td>
                  <td className="px-3 py-2 text-sm text-center text-green-600 font-medium">
                    {row.added > 0 ? `+${row.added}` : '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-center text-red-600 font-medium">
                    {row.subtracted > 0 ? `-${row.subtracted}` : '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-center font-bold text-gray-900">{row.current}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
