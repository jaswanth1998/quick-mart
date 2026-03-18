'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useShiftReport } from '@/hooks/useShiftReports';
import {
  ShiftReportFormProvider,
  useShiftReportForm,
} from '@/components/shift-report/ShiftReportFormProvider';
import ReviewSummary from '@/components/shift-report/ReviewSummary';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { ShiftReportFormState } from '@/components/shift-report/ShiftReportFormProvider';
import type { ShiftReportWithEntries } from '@/hooks/useShiftReports';

/**
 * Map the fetched report (with entries) into the form state shape
 * expected by the ShiftReportFormProvider reducer.
 */
function mapReportToFormState(report: ShiftReportWithEntries): ShiftReportFormState {
  return {
    reportId: report.id,
    reportDate: report.report_date,
    shiftType: report.shift_type,
    shiftIncharge: report.shift_incharge,
    storeLocation: report.store_location,
    status: report.status,
    valueStockEntries: report.value_stock_entries.map((entry) => ({
      amount_label: entry.amount_label,
      sort_order: entry.sort_order,
      start_count: entry.start_count,
      added: entry.added,
      subtracted: entry.subtracted,
      sold: entry.sold,
      end_count: entry.end_count,
      end_count_override: entry.end_count_override,
      has_mismatch: entry.has_mismatch,
    })),
    drawerStockEntries: report.drawer_stock_entries.map((entry) => ({
      drawer_number: entry.drawer_number,
      contents: entry.contents,
      sort_order: entry.sort_order,
      opening: entry.opening,
      addition: entry.addition,
      subtraction: entry.subtraction,
      sold: entry.sold,
      closing: entry.closing,
      closing_override: entry.closing_override,
      has_mismatch: entry.has_mismatch,
    })),
    totalDSales: report.total_d_sales ?? 0,
    totalDPayout: report.total_d_payout ?? 0,
    shiftSales: report.shift_sales ?? 0,
    shiftPayout: report.shift_payout ?? 0,
    activated: report.activated ?? 0,
    valueNotes: report.value_notes ?? '',
    drawerNotes: report.drawer_notes ?? '',
    currentStep: 3,
    isDirty: false,
    lastSavedAt: report.updated_at,
  };
}

/**
 * Inner component that lives inside ShiftReportFormProvider
 * so it can call useShiftReportForm.
 */
function ReportContent({ report }: { report: ShiftReportWithEntries }) {
  const router = useRouter();
  const { dispatch } = useShiftReportForm();

  useEffect(() => {
    dispatch({ type: 'LOAD_REPORT', payload: mapReportToFormState(report) });
  }, [report, dispatch]);

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/shift-report')}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>

        {report.status === 'draft' && (
          <button
            onClick={() => router.push('/shift-report/new/value-stock')}
            className="btn-primary"
          >
            Edit Report
          </button>
        )}
      </div>

      {/* Report review */}
      <ReviewSummary />
    </div>
  );
}

function ShiftReportDetailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id') ? Number(searchParams.get('id')) : null;

  const { data: report, isLoading, isError } = useShiftReport(id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-sm text-gray-500">Loading report...</span>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-500">
          Report not found or an error occurred.
        </p>
        <button
          onClick={() => router.push('/shift-report')}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>
      </div>
    );
  }

  return (
    <ShiftReportFormProvider>
      <ReportContent report={report} />
    </ShiftReportFormProvider>
  );
}

export default function ShiftReportDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-sm text-gray-500">Loading report...</span>
        </div>
      }
    >
      <ShiftReportDetailInner />
    </Suspense>
  );
}
