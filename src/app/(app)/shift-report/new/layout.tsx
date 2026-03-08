'use client';

import { ShiftReportFormProvider } from '@/components/shift-report/ShiftReportFormProvider';
import StepIndicator from '@/components/shift-report/StepIndicator';
import { useShiftReportForm } from '@/components/shift-report/ShiftReportFormProvider';
import { useRouter } from 'next/navigation';

// Inner component that uses the context
function WizardLayout({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useShiftReportForm();
  const router = useRouter();

  const handleStepClick = (step: 1 | 2 | 3) => {
    dispatch({ type: 'SET_STEP', payload: step });
    const routes = { 1: '/shift-report/new/value-stock', 2: '/shift-report/new/drawer-stock', 3: '/shift-report/new/review' };
    router.push(routes[step]);
  };

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={state.currentStep} onStepClick={handleStepClick} />
      {children}
    </div>
  );
}

export default function NewShiftReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShiftReportFormProvider>
      <WizardLayout>{children}</WizardLayout>
    </ShiftReportFormProvider>
  );
}
