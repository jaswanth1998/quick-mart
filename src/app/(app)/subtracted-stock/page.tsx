'use client';

import { useState } from 'react';
import { STORE_LOCATIONS, SHIFT_TYPES, VALUE_STOCK_ROWS, DRAWER_STOCK_ROWS } from '@/lib/shift-report-constants';
import type { ShiftType } from '@/lib/shift-report-constants';
import { useStockSubtractions, useCreateStockSubtraction, useDeleteStockSubtraction } from '@/hooks/useStockSubtractions';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Package, LayoutGrid, Loader2 } from 'lucide-react';
import CurrentStockCard from '@/components/shift-report/CurrentStockCard';

const VALUE_OPTIONS = VALUE_STOCK_ROWS.map((r) => r.label);
const DRAWER_OPTIONS = DRAWER_STOCK_ROWS.map((r) => r.contents);

type StockTab = 'value' | 'drawer';

export default function SubtractedStockPage() {
  const toast = useToast();
  const supabase = createClient();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedShift, setSelectedShift] = useState<ShiftType>('7-3');
  const [selectedStore, setSelectedStore] = useState<string>(STORE_LOCATIONS[0]);
  const [activeTab, setActiveTab] = useState<StockTab>('value');

  const [newItemKey, setNewItemKey] = useState<string>(VALUE_OPTIONS[0]);
  const [newQuantity, setNewQuantity] = useState(1);
  const [newNotes, setNewNotes] = useState('');

  const { data: subtractions, isLoading } = useStockSubtractions({
    additionDate: selectedDate,
    shiftType: selectedShift,
    storeLocation: selectedStore,
  });

  const createMutation = useCreateStockSubtraction();
  const deleteMutation = useDeleteStockSubtraction();

  const filteredSubtractions = (subtractions || []).filter((s) => s.stock_type === activeTab);

  const options = activeTab === 'value' ? VALUE_OPTIONS : DRAWER_OPTIONS;

  const handleTabChange = (tab: StockTab) => {
    setActiveTab(tab);
    setNewItemKey(tab === 'value' ? VALUE_OPTIONS[0] : DRAWER_OPTIONS[0]);
  };

  const handleAdd = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await createMutation.mutateAsync({
        addition_date: selectedDate,
        shift_type: selectedShift,
        store_location: selectedStore,
        stock_type: activeTab,
        item_key: newItemKey,
        quantity: newQuantity,
        notes: newNotes || null,
        created_by: user.id,
      });

      setNewQuantity(1);
      setNewNotes('');
      toast.success('Stock subtraction saved');
    } catch {
      toast.error('Failed to save subtraction');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Subtraction removed');
    } catch {
      toast.error('Failed to remove subtraction');
    }
  };

  const totalQty = filteredSubtractions.reduce((sum, s) => sum + s.quantity, 0);
  const valueCount = (subtractions || []).filter((s) => s.stock_type === 'value').length;
  const drawerCount = (subtractions || []).filter((s) => s.stock_type === 'drawer').length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subtract Stock</h1>
        <p className="text-sm text-gray-500 mt-1">
          Record stock removed during a shift (damaged, write-offs, returns). These automatically reduce shift report counts.
        </p>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input w-full"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Shift</label>
            <select
              className="input w-full"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as ShiftType)}
            >
              {SHIFT_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Store</label>
            <select
              className="input w-full"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              {STORE_LOCATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Current Stock */}
      <CurrentStockCard
        date={selectedDate}
        shiftType={selectedShift}
        storeLocation={selectedStore}
        stockType={activeTab}
      />

      {/* Main card */}
      <div className="card">
        {/* Tabs */}
        <div className="px-6 pt-5 flex gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('value')}
            className={[
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'value'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            <Package className="w-4 h-4" />
            Value Stock
            {valueCount > 0 && (
              <span className={[
                'ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold',
                activeTab === 'value' ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-700',
              ].join(' ')}>
                {valueCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('drawer')}
            className={[
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'drawer'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            <LayoutGrid className="w-4 h-4" />
            Drawer Stock
            {drawerCount > 0 && (
              <span className={[
                'ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold',
                activeTab === 'drawer' ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-700',
              ].join(' ')}>
                {drawerCount}
              </span>
            )}
          </button>
        </div>

        {/* Existing subtractions */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
            </div>
          ) : filteredSubtractions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No {activeTab === 'value' ? 'value stock' : 'drawer stock'} subtractions for this shift.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason / Notes</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSubtractions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{sub.item_key}</td>
                      <td className="px-4 py-3 text-sm text-center font-semibold text-red-600">-{sub.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{sub.notes || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(sub.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                    <td className="px-4 py-3 text-sm text-center font-bold text-red-600">-{totalQty}</td>
                    <td className="px-4 py-3" colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Add new row */}
        <div className="px-6 pb-6 border-t border-gray-200 pt-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Add New Subtraction</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Item</label>
              <select
                className="input w-full text-sm"
                value={newItemKey}
                onChange={(e) => setNewItemKey(e.target.value)}
              >
                {options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Qty</label>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                className="input w-full text-center text-sm font-medium"
                value={newQuantity || ''}
                placeholder="1"
                onChange={(e) =>
                  setNewQuantity(e.target.value === '' ? 1 : Math.max(1, parseInt(e.target.value) || 1))
                }
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Reason / Notes</label>
              <input
                type="text"
                className="input w-full text-sm"
                value={newNotes}
                placeholder="e.g. Damaged, write-off"
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={createMutation.isPending}
              className="btn-primary inline-flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Subtract
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
