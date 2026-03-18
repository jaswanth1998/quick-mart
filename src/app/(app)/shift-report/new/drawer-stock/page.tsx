'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ReportHeader from '@/components/shift-report/ReportHeader';
import DrawerStockTable from '@/components/shift-report/DrawerStockTable';
import { useShiftReportForm } from '@/components/shift-report/ShiftReportFormProvider';
import { useToast } from '@/components/ui/Toast';
import { useCreateShiftReport, useUpdateShiftReport, useSaveDrawerStockEntries, usePreviousShiftClosing } from '@/hooks/useShiftReports';
import { useStockAdditionsForShift } from '@/hooks/useStockAdditions';
import { useStockSubtractionsForShift } from '@/hooks/useStockSubtractions';
import { createClient } from '@/lib/supabase/client';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export default function DrawerStockPage() {
  const router = useRouter();
  const { state, dispatch } = useShiftReportForm();
  const toast = useToast();
  const supabase = createClient();

  const createMutation = useCreateShiftReport();
  const updateMutation = useUpdateShiftReport();
  const saveMutation = useSaveDrawerStockEntries();

  const { data: previousClosing } = usePreviousShiftClosing(
    state.reportDate,
    state.shiftType,
    state.storeLocation
  );

  const { data: additionsData } = useStockAdditionsForShift(
    state.reportDate,
    state.shiftType,
    state.storeLocation
  );

  const { data: subtractionsData } = useStockSubtractionsForShift(
    state.reportDate,
    state.shiftType,
    state.storeLocation
  );

  // Set current step on mount
  useEffect(() => {
    dispatch({ type: 'SET_STEP', payload: 2 });
  }, [dispatch]);

  // When previous shift closing data comes back, set drawer openings
  useEffect(() => {
    if (previousClosing?.drawerStockClosing) {
      dispatch({ type: 'SET_DRAWER_STOCK_OPENINGS', payload: previousClosing.drawerStockClosing });
    }
  }, [previousClosing, dispatch]);

  // When additions data loads, set drawer added values
  useEffect(() => {
    if (additionsData?.drawerAdded) {
      dispatch({ type: 'SET_DRAWER_STOCK_ADDED', payload: additionsData.drawerAdded });
    }
  }, [additionsData, dispatch]);

  // When subtractions data loads, set drawer subtracted values
  useEffect(() => {
    if (subtractionsData?.drawerSubtracted) {
      dispatch({ type: 'SET_DRAWER_STOCK_SUBTRACTED', payload: subtractionsData.drawerSubtracted });
    }
  }, [subtractionsData, dispatch]);

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

      // Save drawer stock entries
      await saveMutation.mutateAsync({
        reportId,
        entries: state.drawerStockEntries,
      });

      // Update the report with summary field values
      await updateMutation.mutateAsync({
        id: reportId,
        drawer_notes: state.drawerNotes,
      });

      dispatch({ type: 'SET_SAVED', payload: new Date().toISOString() });
      toast.success('Draft saved successfully');
    } catch {
      toast.error('Failed to save draft');
    }
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 1 });
    router.push('/shift-report/new/value-stock');
  };

  const handleNext = () => {
    dispatch({ type: 'SET_STEP', payload: 3 });
    router.push('/shift-report/new/review');
  };

  const isSaving = createMutation.isPending || saveMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <ReportHeader onSaveDraft={handleSaveDraft} saving={isSaving} />

      <DrawerStockTable />

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2"
          onClick={handleBack}
        >
          <ChevronLeft className="w-4 h-4" />
          Back: Value Stock
        </button>
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={handleNext}
        >
          Next: Review
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
