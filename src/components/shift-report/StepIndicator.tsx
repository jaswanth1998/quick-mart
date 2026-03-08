'use client';

import { Check } from 'lucide-react';

const steps = [
  { step: 1 as const, label: 'Value Stock' },
  { step: 2 as const, label: 'Drawer Stock' },
  { step: 3 as const, label: 'Review & Submit' },
];

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
}

export default function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full">
      {steps.map((s, idx) => {
        const isCompleted = s.step < currentStep;
        const isCurrent = s.step === currentStep;

        return (
          <div key={s.step} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                disabled={!isCompleted}
                onClick={() => isCompleted && onStepClick?.(s.step)}
                className={[
                  'flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-colors',
                  isCompleted
                    ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                    : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'border-2 border-gray-300 text-gray-400',
                  !isCompleted && 'cursor-default',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : s.step}
              </button>
              <span
                className={[
                  'mt-1.5 text-xs font-medium hidden sm:block',
                  isCompleted
                    ? 'text-green-600'
                    : isCurrent
                      ? 'text-blue-600'
                      : 'text-gray-400',
                ].join(' ')}
              >
                {s.label}
              </span>
            </div>

            {/* Connecting line (not after last step) */}
            {idx < steps.length - 1 && (
              <div
                className={[
                  'w-16 sm:w-24 h-0.5 mx-2',
                  s.step < currentStep ? 'bg-green-500' : 'bg-gray-300',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
