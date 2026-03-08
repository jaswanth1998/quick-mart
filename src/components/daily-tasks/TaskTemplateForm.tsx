'use client';

import { DAYS_OF_WEEK, TASK_SHIFT_TYPES } from '@/lib/daily-tasks-constants';
import { STORE_LOCATIONS } from '@/lib/shift-report-constants';
import type { TaskTemplate } from '@/hooks/useTaskTemplates';

interface TaskTemplateFormProps {
  formData: {
    task_name: string;
    description: string;
    day_of_week: number;
    shift_type: string;
    store_location: string;
    sort_order: number;
    is_active: boolean;
  };
  onChange: (data: TaskTemplateFormProps['formData']) => void;
  editing?: TaskTemplate | null;
}

export function TaskTemplateForm({ formData, onChange, editing }: TaskTemplateFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Task Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          className="input"
          placeholder="e.g. Clean restrooms"
          value={formData.task_name}
          onChange={(e) => onChange({ ...formData, task_name: e.target.value })}
          maxLength={255}
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="input"
          rows={3}
          placeholder="Detailed instructions for this task..."
          value={formData.description}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Day of Week <span className="text-red-500">*</span></label>
          <select
            className="select"
            value={formData.day_of_week}
            onChange={(e) => onChange({ ...formData, day_of_week: parseInt(e.target.value) })}
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day.value} value={day.value}>{day.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Shift <span className="text-red-500">*</span></label>
          <select
            className="select"
            value={formData.shift_type}
            onChange={(e) => onChange({ ...formData, shift_type: e.target.value })}
          >
            {TASK_SHIFT_TYPES.map((shift) => (
              <option key={shift} value={shift}>{shift.charAt(0).toUpperCase() + shift.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Store <span className="text-red-500">*</span></label>
          <select
            className="select"
            value={formData.store_location}
            onChange={(e) => onChange({ ...formData, store_location: e.target.value })}
          >
            {STORE_LOCATIONS.map((store) => (
              <option key={store} value={store}>{store}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Sort Order</label>
          <input
            type="number"
            className="input"
            value={formData.sort_order}
            onChange={(e) => onChange({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            min={0}
          />
        </div>
      </div>
      {editing && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => onChange({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
        </div>
      )}
    </div>
  );
}
