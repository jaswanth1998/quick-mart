'use client';

import { Save, Send } from 'lucide-react';
import { STORE_LOCATIONS, SHIFT_TYPES } from '@/lib/shift-report-constants';
import { useShiftReportForm } from './ShiftReportFormProvider';

interface ReportHeaderProps {
  onSaveDraft: () => void;
  onSubmit?: () => void;
  saving?: boolean;
  submitting?: boolean;
}

export default function ReportHeader({ onSaveDraft, onSubmit, saving, submitting }: ReportHeaderProps) {
  const { state, dispatch } = useShiftReportForm();

  return (
    <div className="card p-6">
      {/* Title row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Stock Report</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in shift details and stock data</p>
        </div>
        <span className={state.status === 'draft' ? 'badge-orange' : 'badge-green'}>
          {state.status === 'draft' ? 'Draft' : 'Submitted'}
        </span>
      </div>

      {/* Form grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Date */}
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input w-full"
            value={state.reportDate}
            onChange={(e) =>
              dispatch({ type: 'SET_HEADER', payload: { reportDate: e.target.value } })
            }
          />
        </div>

        {/* Shift Incharge */}
        <div>
          <label className="label">Shift Incharge</label>
          <input
            type="text"
            className="input w-full"
            placeholder="Enter name"
            value={state.shiftIncharge}
            onChange={(e) =>
              dispatch({ type: 'SET_HEADER', payload: { shiftIncharge: e.target.value } })
            }
          />
        </div>

        {/* Shift */}
        <div>
          <label className="label">Shift</label>
          <select
            className="select w-full"
            value={state.shiftType}
            onChange={(e) =>
              dispatch({
                type: 'SET_HEADER',
                payload: { shiftType: e.target.value as (typeof SHIFT_TYPES)[number] },
              })
            }
          >
            {SHIFT_TYPES.map((shift) => (
              <option key={shift} value={shift}>
                {shift}
              </option>
            ))}
          </select>
        </div>

        {/* Store / Location */}
        <div>
          <label className="label">Store / Location</label>
          <select
            className="select w-full"
            value={state.storeLocation}
            onChange={(e) =>
              dispatch({ type: 'SET_HEADER', payload: { storeLocation: e.target.value } })
            }
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

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2"
          onClick={onSaveDraft}
          disabled={saving}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Draft'}
        </button>

        {onSubmit && state.status === 'draft' && (
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={onSubmit}
            disabled={submitting}
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        )}

        {state.lastSavedAt && state.status === 'draft' && (
          <span className="text-sm text-gray-500 ml-auto">
            Last saved: {new Date(state.lastSavedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
