'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { CASH_DENOMINATIONS } from '@/lib/cash-counting-constants';
import { STORE_LOCATIONS, SHIFT_TYPES } from '@/lib/shift-report-constants';
import { CashCountingEntry, calculateTotalAmount, calculateRemaining } from '@/lib/cash-counting-utils';
import { useCreateCashCountingEntry, useUpdateCashCountingEntry } from '@/hooks/useCashCounting';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';

interface CashCountingEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: CashCountingEntry | null;
}

export default function CashCountingEntryModal({
  isOpen,
  onClose,
  entry,
}: CashCountingEntryModalProps) {
  const toast = useToast();
  const createMutation = useCreateCashCountingEntry();
  const updateMutation = useUpdateCashCountingEntry();

  const [formData, setFormData] = useState({
    entry_date: '',
    shift_type: '7-3',
    shift_incharge: '',
    store_location: '',
    bills_100: 0,
    bills_50: 0,
    bills_20: 0,
    bills_10: 0,
    bills_5: 0,
    bills_2: 0,
    bills_1: 0,
    coins_25: 0,
    coins_10: 0,
    coins_5: 0,
    sale_drop: 0,
    total_sale_drops: 0,
    notes: '',
  });

  // Calculate derived values
  const totalAmount = calculateTotalAmount(formData);
  const remaining = calculateRemaining(totalAmount, formData.sale_drop);

  useEffect(() => {
    if (entry) {
      setFormData({
        entry_date: entry.entry_date,
        shift_type: entry.shift_type,
        shift_incharge: entry.shift_incharge,
        store_location: entry.store_location,
        bills_100: entry.bills_100,
        bills_50: entry.bills_50,
        bills_20: entry.bills_20,
        bills_10: entry.bills_10,
        bills_5: entry.bills_5,
        bills_2: entry.bills_2,
        bills_1: entry.bills_1,
        coins_25: entry.coins_25,
        coins_10: entry.coins_10,
        coins_5: entry.coins_5,
        sale_drop: entry.sale_drop,
        total_sale_drops: entry.total_sale_drops,
        notes: entry.notes || '',
      });
    } else {
      // Reset form for new entry
      setFormData({
        entry_date: new Date().toISOString().split('T')[0],
        shift_type: '7-3',
        shift_incharge: '',
        store_location: '',
        bills_100: 0,
        bills_50: 0,
        bills_20: 0,
        bills_10: 0,
        bills_5: 0,
        bills_2: 0,
        bills_1: 0,
        coins_25: 0,
        coins_10: 0,
        coins_5: 0,
        sale_drop: 0,
        total_sale_drops: 0,
        notes: '',
      });
    }
  }, [entry, isOpen]);

  const handleSubmit = async (status: 'draft' | 'submitted') => {
    if (!formData.entry_date || !formData.shift_incharge || !formData.store_location) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        ...formData,
        total_amount: totalAmount,
        remaining,
        status,
      };

      if (entry) {
        await updateMutation.mutateAsync({
          id: entry.id,
          ...payload,
        });
        toast.success('Entry updated successfully');
      } else {
        // Get current user
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('User not authenticated');
          return;
        }

        await createMutation.mutateAsync({
          ...payload,
          created_by: user.id,
        } as Omit<CashCountingEntry, 'id' | 'created_at' | 'updated_at'>);
        toast.success('Entry created successfully');
      }

      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save entry');
    }
  };

  const handleDenominationChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      [key]: value === '' ? 0 : parseInt(value) || 0,
    });
  };

  const bills = CASH_DENOMINATIONS.filter(d => d.type === 'bill');
  const coins = CASH_DENOMINATIONS.filter(d => d.type === 'coin');

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={entry ? 'Edit Cash Counting Entry' : 'Add Cash Counting Entry'}
      width="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Header Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Entry Date *</label>
            <input
              type="date"
              className="input w-full"
              value={formData.entry_date}
              onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Shift Type *</label>
            <select
              className="select w-full"
              value={formData.shift_type}
              onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
            >
              {SHIFT_TYPES.map((shift) => (
                <option key={shift} value={shift}>
                  {shift}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Shift Incharge *</label>
            <input
              type="text"
              className="input w-full"
              placeholder="Enter name"
              value={formData.shift_incharge}
              onChange={(e) => setFormData({ ...formData, shift_incharge: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Store Location *</label>
            <select
              className="select w-full"
              value={formData.store_location}
              onChange={(e) => setFormData({ ...formData, store_location: e.target.value })}
            >
              <option value="">Select location</option>
              {STORE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bills Section */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Bills</h3>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {bills.map((denom) => (
              <div key={denom.key}>
                <label className="label">{denom.label}</label>
                <input
                  type="number"
                  min="0"
                  className="input w-full text-center"
                  value={formData[denom.key as keyof typeof formData] || ''}
                  placeholder="0"
                  onChange={(e) => handleDenominationChange(denom.key, e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  ${((formData[denom.key as keyof typeof formData] as number || 0) * denom.faceValue).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Coins Section */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Coins</h3>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {coins.map((denom) => (
              <div key={denom.key}>
                <label className="label">{denom.label}</label>
                <input
                  type="number"
                  min="0"
                  className="input w-full text-center"
                  value={formData[denom.key as keyof typeof formData] || ''}
                  placeholder="0"
                  onChange={(e) => handleDenominationChange(denom.key, e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  ${((formData[denom.key as keyof typeof formData] as number || 0) * denom.faceValue).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Calculated Totals */}
        <div className="card bg-blue-50 border-blue-200">
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="label text-blue-700">Total Amount (TM)</span>
              <p className="text-2xl font-bold text-blue-900">${totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <label className="label text-blue-700">Sale Drop (SD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input w-full"
                value={formData.sale_drop || ''}
                placeholder="0.00"
                onChange={(e) => setFormData({ ...formData, sale_drop: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <span className="label text-blue-700">Remaining (RM)</span>
              <p className="text-2xl font-bold text-blue-900">${remaining.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Total Sale Drops */}
        <div>
          <label className="label">Total Sale Drops (TSD)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input w-full"
            value={formData.total_sale_drops || ''}
            placeholder="0.00"
            onChange={(e) => setFormData({ ...formData, total_sale_drops: parseFloat(e.target.value) || 0 })}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes</label>
          <textarea
            className="input w-full"
            rows={3}
            placeholder="Add notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleSubmit('draft')}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            Save as Draft
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleSubmit('submitted')}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
