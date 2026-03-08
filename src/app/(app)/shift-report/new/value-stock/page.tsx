'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ReportHeader from '@/components/shift-report/ReportHeader';
import ValueStockTable from '@/components/shift-report/ValueStockTable';
import ValueStockSummary from '@/components/shift-report/ValueStockSummary';
import { useShiftReportForm } from '@/components/shift-report/ShiftReportFormProvider';
import { useToast } from '@/components/ui/Toast';
import { useCreateShiftReport, useUpdateShiftReport, useSaveValueStockEntries, usePreviousShiftClosing } from '@/hooks/useShiftReports';
import { createClient } from '@/lib/supabase/client';
import { ChevronRight } from 'lucide-react';

export default function ValueStockPage() {
  const router = useRouter();
  const { state, dispatch } = useShiftReportForm();
  const toast = useToast();
  const supabase = createClient();

  const createMutation = useCreateShiftReport();
  const updateMutation = useUpdateShiftReport();
  const saveMutation = useSaveValueStockEntries();

  const { data: previousClosing } = usePreviousShiftClosing(
    state.reportDate,
    state.shiftType,
    state.storeLocation
  );

  // Set current step on mount
  useEffect(() => {
    dispatch({ type: 'SET_STEP', payload: 1 });
  }, [dispatch]);

  // When previous shift closing data comes back, set start counts
  useEffect(() => {
    if (previousClosing?.valueStockClosing) {
      dispatch({ type: 'SET_VALUE_STOCK_START_COUNTS', payload: previousClosing.valueStockClosing });
    }
  }, [previousClosing, dispatch]);

  const handleSaveDraft = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let reportId = state.reportId;

      // Create report if it doesn't exist yet
      if (!reportId) {
        const newReport = await createMutation.mutateAsync({
          report_date: state.reportDate,
          shift_type: state.shiftType,
          shift_incharge: state.shiftIncharge,
          store_location: state.storeLocation,
          status: 'draft' as const,
          created_by: user.id,
        });
        reportId = newReport.id as number;
        dispatch({ type: 'SET_REPORT_ID', payload: reportId });
      }

      // Save value stock entries
      await saveMutation.mutateAsync({
        reportId,
        entries: state.valueStockEntries,
      });

      // Update the report with summary field values
      await updateMutation.mutateAsync({
        id: reportId,
        total_d_sales: state.totalDSales,
        total_d_payout: state.totalDPayout,
        shift_sales: state.shiftSales,
        shift_payout: state.shiftPayout,
        activated: state.activated,
        value_notes: state.valueNotes,
      });

      dispatch({ type: 'SET_SAVED', payload: new Date().toISOString() });
      toast.success('Draft saved successfully');
    } catch {
      toast.error('Failed to save draft');
    }
  };

  const handleNext = () => {
    dispatch({ type: 'SET_STEP', payload: 2 });
    router.push('/shift-report/new/drawer-stock');
  };

  const isSaving = createMutation.isPending || saveMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <ReportHeader onSaveDraft={handleSaveDraft} saving={isSaving} />

      {/* Desktop: side by side | Mobile: stacked */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <ValueStockTable />
        </div>
        <div className="w-full lg:w-80">
          <ValueStockSummary />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={handleNext}
        >
          Next: Drawer Stock
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
