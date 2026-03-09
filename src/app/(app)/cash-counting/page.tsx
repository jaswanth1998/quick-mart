'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useCashCountingEntries, useCashCountingAnalytics, useDeleteCashCountingEntry } from '@/hooks/useCashCounting';
import { useUserRole } from '@/hooks/useUserRole';
import CashCountingHeader from '@/components/cash-counting/CashCountingHeader';
import CashCountingKPICards from '@/components/cash-counting/CashCountingKPICards';
import CashCountingCharts from '@/components/cash-counting/CashCountingCharts';
import DenominationBreakdownPanel from '@/components/cash-counting/DenominationBreakdownPanel';
import ShiftAnalysisTable from '@/components/cash-counting/ShiftAnalysisTable';
import CashCountingDetailModal from '@/components/cash-counting/CashCountingDetailModal';
import CashCountingEntryModal from '@/components/cash-counting/CashCountingEntryModal';
import CashCountingInsights from '@/components/cash-counting/CashCountingInsights';
import CashCountingAlerts from '@/components/cash-counting/CashCountingAlerts';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { CashCountingEntry } from '@/lib/cash-counting-utils';

export default function CashCountingPage() {
  const { isAdmin, isLoading: authLoading } = useUserRole();
  const toast = useToast();
  const deleteMutation = useDeleteCashCountingEntry();

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    shiftType: '',
    storeLocation: '',
    startDate: '',
    endDate: '',
  });

  // Modals
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CashCountingEntry | null>(null);

  // Fetch data
  const { data: entriesData } = useCashCountingEntries({
    search: filters.search,
    shiftType: filters.shiftType,
    storeLocation: filters.storeLocation,
    startDate: filters.startDate,
    endDate: filters.endDate,
    page: 1,
    pageSize: isAdmin ? 1000 : 10,
  });

  const { data: analytics } = useCashCountingAnalytics(
    {
      startDate: filters.startDate,
      endDate: filters.endDate,
      shiftType: filters.shiftType,
      storeLocation: filters.storeLocation,
    },
    { enabled: isAdmin }
  );

  const entries = entriesData?.data || [];

  // Handlers
  const handleAddEntry = () => {
    setSelectedEntry(null);
    setShowEntryModal(true);
  };

  const handleView = (entry: CashCountingEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  const handleEdit = (entry: CashCountingEntry) => {
    setSelectedEntry(entry);
    setShowEntryModal(true);
  };

  const handleDelete = (entry: CashCountingEntry) => {
    setSelectedEntry(entry);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedEntry) return;

    try {
      await deleteMutation.mutateAsync(selectedEntry.id);
      toast.success('Entry deleted successfully');
      setShowDeleteConfirm(false);
      setSelectedEntry(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete entry');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <CashCountingHeader
        filters={filters}
        onFiltersChange={setFilters}
        onAddEntry={handleAddEntry}
        entries={entries}
      />

      {/* KPI Cards - Admin only */}
      {isAdmin && <CashCountingKPICards entries={entries} />}

      {/* Charts and Breakdown - Admin only */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CashCountingCharts analytics={analytics} />
          </div>
          <div>
            <DenominationBreakdownPanel entries={entries} />
          </div>
        </div>
      )}

      {/* Shift Analysis Table */}
      <ShiftAnalysisTable
        entries={entries}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Insights and Alerts - Admin only */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CashCountingInsights entries={entries} />
          <CashCountingAlerts entries={entries} />
        </div>
      )}

      {/* Modals */}
      <CashCountingEntryModal
        isOpen={showEntryModal}
        onClose={() => {
          setShowEntryModal(false);
          setSelectedEntry(null);
        }}
        entry={selectedEntry}
      />

      <CashCountingDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEntry(null);
        }}
        entry={selectedEntry}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedEntry(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Entry"
        message={`Are you sure you want to delete the entry for ${selectedEntry?.entry_date} (${selectedEntry?.shift_type})? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
