'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { TaskTemplateForm } from '@/components/daily-tasks/TaskTemplateForm';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import {
  useTaskTemplates,
  useCreateTaskTemplate,
  useUpdateTaskTemplate,
  useDeleteTaskTemplate,
  type TaskTemplate,
} from '@/hooks/useTaskTemplates';
import { useUserRole } from '@/hooks/useUserRole';
import { DAYS_OF_WEEK, TASK_SHIFT_TYPES } from '@/lib/daily-tasks-constants';
import { STORE_LOCATIONS } from '@/lib/shift-report-constants';
import { formatDateTime } from '@/lib/utils';

const defaultFormData = {
  task_name: '',
  description: '',
  day_of_week: 1,
  shift_type: 'morning' as string,
  store_location: '4403 Kingston' as string,
  sort_order: 0,
  is_active: true,
};

export default function TemplatesPage() {
  const { isLoading: authLoading } = useRequireAdmin();
  const { profile } = useUserRole();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dayFilter, setDayFilter] = useState<number | undefined>(undefined);
  const [shiftFilter, setShiftFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskTemplate | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TaskTemplate | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: templatesData, isLoading } = useTaskTemplates({
    search,
    dayOfWeek: dayFilter,
    shiftType: shiftFilter || undefined,
    storeLocation: storeFilter || undefined,
    isActive: undefined,
    page,
    pageSize,
  });

  const createMutation = useCreateTaskTemplate();
  const updateMutation = useUpdateTaskTemplate();
  const deleteMutation = useDeleteTaskTemplate();

  const columns: DataTableColumn<TaskTemplate>[] = [
    {
      title: 'Task Name', dataIndex: 'task_name', key: 'task_name', ellipsis: true,
      render: (name, record) => (
        <button onClick={() => handleOpenModal(record)} className="text-blue-600 hover:text-blue-800 font-medium text-left">
          {name as string}
        </button>
      ),
    },
    {
      title: 'Day', dataIndex: 'day_of_week', key: 'day_of_week', width: 110,
      render: (val) => DAYS_OF_WEEK.find(d => d.value === val)?.label || String(val),
      sorter: (a, b) => a.day_of_week - b.day_of_week,
    },
    {
      title: 'Shift', dataIndex: 'shift_type', key: 'shift_type', width: 100,
      render: (val) => <span className="badge-blue">{(val as string).charAt(0).toUpperCase() + (val as string).slice(1)}</span>,
    },
    {
      title: 'Store', dataIndex: 'store_location', key: 'store_location', width: 100,
    },
    {
      title: 'Active', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (val) => val ? <span className="badge-green">Yes</span> : <span className="badge-red">No</span>,
    },
    {
      title: 'Order', dataIndex: 'sort_order', key: 'sort_order', width: 70,
      sorter: (a, b) => a.sort_order - b.sort_order,
    },
    {
      title: 'Created', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (val) => formatDateTime(val as string),
    },
  ];

  const handleOpenModal = (template?: TaskTemplate) => {
    if (template) {
      setEditing(template);
      setFormData({
        task_name: template.task_name,
        description: template.description || '',
        day_of_week: template.day_of_week,
        shift_type: template.shift_type,
        store_location: template.store_location,
        sort_order: template.sort_order,
        is_active: template.is_active,
      });
    } else {
      setEditing(null);
      setFormData(defaultFormData);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.task_name.trim()) {
      toast.error('Task name is required');
      return;
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          task_name: formData.task_name,
          description: formData.description || null,
          day_of_week: formData.day_of_week,
          shift_type: formData.shift_type as 'morning' | 'evening',
          store_location: formData.store_location,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
        });
        toast.success('Template updated');
      } else {
        if (!profile) return;
        await createMutation.mutateAsync({
          task_name: formData.task_name,
          description: formData.description || null,
          day_of_week: formData.day_of_week,
          shift_type: formData.shift_type as 'morning' | 'evening',
          store_location: formData.store_location,
          sort_order: formData.sort_order,
          is_active: true,
          created_by: profile.id,
        });
        toast.success('Template created');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save template');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync(confirmDelete.id);
      toast.success('Template deactivated');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate template');
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Task Templates</h1>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="label">Day</label>
            <select className="select w-36" value={dayFilter ?? ''} onChange={(e) => { setDayFilter(e.target.value === '' ? undefined : parseInt(e.target.value)); setPage(1); }}>
              <option value="">All Days</option>
              {DAYS_OF_WEEK.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Shift</label>
            <select className="select w-32" value={shiftFilter} onChange={(e) => { setShiftFilter(e.target.value); setPage(1); }}>
              <option value="">All Shifts</option>
              {TASK_SHIFT_TYPES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Store</label>
            <select className="select w-32" value={storeFilter} onChange={(e) => { setStoreFilter(e.target.value); setPage(1); }}>
              <option value="">All Stores</option>
              {STORE_LOCATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <DataTable<TaskTemplate>
        title="Templates"
        columns={columns}
        data={templatesData?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total: templatesData?.total || 0,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
        search={{
          placeholder: 'Search by task name...',
          value: search,
          onChange: (v) => { setSearch(v); setPage(1); },
        }}
        actions={{
          onAdd: () => handleOpenModal(),
          onDelete: (record) => setConfirmDelete(record),
          addLabel: 'Add Template',
          deleteLabel: 'Deactivate',
        }}
        exportFileName="task-templates"
      />

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Edit Template' : 'Add Template'}
        width="max-w-xl"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save'}
            </button>
          </>
        }
      >
        <TaskTemplateForm formData={formData} onChange={setFormData} editing={editing} />
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Deactivate Template"
        message={`Are you sure you want to deactivate "${confirmDelete?.task_name}"? It will no longer appear in daily tasks.`}
        confirmText="Deactivate"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
