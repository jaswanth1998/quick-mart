'use client';

import { Modal } from '@/components/ui/Modal';
import { CASH_DENOMINATIONS } from '@/lib/cash-counting-constants';
import type { CashCountingEntry } from '@/lib/cash-counting-utils';
import { Printer } from 'lucide-react';

interface CashCountingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: CashCountingEntry | null;
}

export default function CashCountingDetailModal({
  isOpen,
  onClose,
  entry,
}: CashCountingDetailModalProps) {
  if (!entry) return null;

  const bills = CASH_DENOMINATIONS.filter(d => d.type === 'bill');
  const coins = CASH_DENOMINATIONS.filter(d => d.type === 'coin');

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Cash Counting Entry Details"
      width="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Shift Information</h3>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="label">Entry Date</span>
              <p className="font-medium text-gray-900">{entry.entry_date}</p>
            </div>
            <div>
              <span className="label">Shift Type</span>
              <p className="font-medium text-gray-900">{entry.shift_type}</p>
            </div>
            <div>
              <span className="label">Shift Incharge</span>
              <p className="font-medium text-gray-900">{entry.shift_incharge}</p>
            </div>
            <div>
              <span className="label">Store Location</span>
              <p className="font-medium text-gray-900">{entry.store_location}</p>
            </div>
          </div>
        </div>

        {/* Bills */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Bills</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Denomination
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bills.map((denom) => {
                  const count = entry[denom.key];
                  const value = count * denom.faceValue;
                  return (
                    <tr key={denom.key} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                        {denom.label}
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-mono text-gray-600">
                        {count}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">
                        ${value.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coins */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Coins</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Denomination
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coins.map((denom) => {
                  const count = entry[denom.key];
                  const value = count * denom.faceValue;
                  return (
                    <tr key={denom.key} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                        {denom.label}
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-mono text-gray-600">
                        {count}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">
                        ${value.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="card bg-blue-50 border-blue-200">
          <div className="px-6 py-4 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900">Summary</h3>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="label text-blue-700">Total Sale Drops (TSD)</span>
              <p className="text-xl font-bold text-blue-900">${entry.total_sale_drops.toFixed(2)}</p>
            </div>
            <div>
              <span className="label text-blue-700">Total Amount (TM)</span>
              <p className="text-xl font-bold text-blue-900">${entry.total_amount.toFixed(2)}</p>
            </div>
            <div>
              <span className="label text-blue-700">Sale Drop (SD)</span>
              <p className="text-xl font-bold text-blue-900">${entry.sale_drop.toFixed(2)}</p>
            </div>
            <div>
              <span className="label text-blue-700">Remaining (RM)</span>
              <p className="text-xl font-bold text-blue-900">${entry.remaining.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.notes}</p>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <span className={entry.status === 'draft' ? 'badge-orange' : 'badge-green'}>
            {entry.status === 'draft' ? 'Draft' : 'Submitted'}
          </span>
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
    </Modal>
  );
}
