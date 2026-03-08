'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReportHeader from '@/components/shift-report/ReportHeader';
import ReviewSummary from '@/components/shift-report/ReviewSummary';
import { useShiftReportForm } from '@/components/shift-report/ShiftReportFormProvider';
import { useToast } from '@/components/ui/Toast';
import { useCreateShiftReport, useUpdateShiftReport, useSaveValueStockEntries, useSaveDrawerStockEntries, useSubmitShiftReport } from '@/hooks/useShiftReports';
import { ConfirmModal } from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, Send } from 'lucide-react';

export default function ReviewPage() {
  const router = useRouter();
  const { state, dispatch } = useShiftReportForm();
  const toast = useToast();
  const supabase = createClient();
  const [showConfirm, setShowConfirm] = useState(false);

  const createMutation = useCreateShiftReport();
  const updateMutation = useUpdateShiftReport();
  const saveValueMutation = useSaveValueStockEntries();
  const saveDrawerMutation = useSaveDrawerStockEntries();
  const submitMutation = useSubmitShiftReport();

  // Set current step on mount
  useEffect(() => {
    dispatch({ type: 'SET_STEP', payload: 3 });
  }, [dispatch]);

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

      // Save both value and drawer stock entries
      await saveValueMutation.mutateAsync({
        reportId,
        entries: state.valueStockEntries,
      });

      await saveDrawerMutation.mutateAsync({
        reportId,
        entries: state.drawerStockEntries,
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
        drawer_notes: state.drawerNotes,
      });

      dispatch({ type: 'SET_SAVED', payload: new Date().toISOString() });
      toast.success('Draft saved successfully');
    } catch {
      toast.error('Failed to save draft');
    }
  };

  const handleSubmit = async () => {
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

      // Save both value and drawer stock entries
      await saveValueMutation.mutateAsync({
        reportId,
        entries: state.valueStockEntries,
      });

      await saveDrawerMutation.mutateAsync({
        reportId,
        entries: state.drawerStockEntries,
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
        drawer_notes: state.drawerNotes,
      });

      // Submit the report
      await submitMutation.mutateAsync({ id: reportId, userId: user.id });

      dispatch({ type: 'SET_STATUS', payload: 'submitted' });
      toast.success('Report submitted successfully');
      router.push('/shift-report');
    } catch {
      toast.error('Failed to submit report');
    }
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 2 });
    router.push('/shift-report/new/drawer-stock');
  };

  const isSaving =
    createMutation.isPending ||
    saveValueMutation.isPending ||
    saveDrawerMutation.isPending ||
    updateMutation.isPending;

  const isSubmitting = submitMutation.isPending || isSaving;

  return (
    <div className="space-y-6">
      <ReportHeader
        onSaveDraft={handleSaveDraft}
        onSubmit={() => setShowConfirm(true)}
        saving={isSaving}
        submitting={isSubmitting}
      />

      <ReviewSummary />

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2"
          onClick={handleBack}
        >
          <ChevronLeft className="w-4 h-4" />
          Back: Drawer Stock
        </button>
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => setShowConfirm(true)}
          disabled={isSubmitting}
        >
          <Send className="w-4 h-4" />
          Submit Report
        </button>
      </div>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        title="Submit Shift Report"
        message="Are you sure you want to submit this shift report? Once submitted, it cannot be edited."
        confirmText="Submit Report"
        loading={isSubmitting}
      />
    </div>
  );
}
