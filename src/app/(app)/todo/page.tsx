'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle, Loader2 } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  useTodos,
  useDeleteTodo,
  useCreateTodo,
  useUpdateTodo,
  Todo,
} from '@/hooks/useTodos';
import dayjs, { Dayjs } from 'dayjs';
import { getDefaultDateRange, formatDateTime, formatDate } from '@/lib/utils';

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending', badge: 'badge-gray' },
  { label: 'In Progress', value: 'in_progress', badge: 'badge-blue' },
  { label: 'Completed', value: 'completed', badge: 'badge-green' },
  { label: 'Archived', value: 'archived', badge: 'badge-red' },
];

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low', badge: 'badge-blue' },
  { label: 'Medium', value: 'medium', badge: 'badge-orange' },
  { label: 'High', value: 'high', badge: 'badge-red' },
];

export default function TodoPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
    const [startDate, endDate] = getDefaultDateRange();
    return [dayjs(startDate), dayjs(endDate)];
  });

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Todo | null>(null);
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: Todo['status'];
    priority: Todo['priority'];
    due_date: string;
  }>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
  });

  const { data: todosData, isLoading } = useTodos({
    search,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    startDate: dateRange[0].format('YYYY-MM-DD'),
    endDate: dateRange[1].format('YYYY-MM-DD'),
    page,
    pageSize,
  });

  const deleteMutation = useDeleteTodo();
  const createMutation = useCreateTodo();
  const updateMutation = useUpdateTodo();

  const columns: DataTableColumn<Todo>[] = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a, b) => a.id - b.id },
    {
      title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true,
      render: (title, record) => (
        <button onClick={() => handleOpenModal(record)} className="text-blue-600 hover:text-blue-800 font-medium text-left">
          {title as string}
        </button>
      ),
    },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 130,
      render: (val) => {
        const status = val as string;
        const opt = STATUS_OPTIONS.find((o) => o.value === status);
        return (
          <span className={opt?.badge || 'badge-gray'}>
            {status === 'completed' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
            {opt?.label || status}
          </span>
        );
      },
    },
    {
      title: 'Priority', dataIndex: 'priority', key: 'priority', width: 100,
      render: (val) => {
        const priority = val as string;
        const opt = PRIORITY_OPTIONS.find((o) => o.value === priority);
        return <span className={opt?.badge || 'badge-gray'}>{opt?.label || priority}</span>;
      },
    },
    {
      title: 'Due Date', dataIndex: 'due_date', key: 'due_date', width: 120,
      render: (date) => (date ? formatDate(date as string) : '-'),
      sorter: (a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      },
    },
    {
      title: 'Created At', dataIndex: 'created_at', key: 'created_at', width: 180,
      render: (date) => formatDateTime(date as string),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
  ];

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync(confirmDelete.id);
      toast.success('Todo deleted successfully');
      setConfirmDelete(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete todo');
    }
  };

  const handleOpenModal = (todo?: Todo) => {
    if (todo) {
      setEditingTodo(todo);
      setFormData({
        title: todo.title,
        description: todo.description || '',
        status: todo.status,
        priority: todo.priority,
        due_date: todo.due_date || '',
      });
    } else {
      setEditingTodo(null);
      setFormData({ title: '', description: '', status: 'pending', priority: 'medium', due_date: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const todoData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
      };

      if (editingTodo) {
        await updateMutation.mutateAsync({ id: editingTodo.id, ...todoData });
        toast.success('Todo updated successfully');
      } else {
        await createMutation.mutateAsync(todoData);
        toast.success('Todo created successfully');
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save todo');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="label">Status</label>
            <select className="select w-40" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="select w-40" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
              <option value="">All Priorities</option>
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable<Todo>
        title="Todos"
        columns={columns}
        data={todosData?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total: todosData?.total || 0,
          onChange: (newPage, newPageSize) => { setPage(newPage); setPageSize(newPageSize); },
        }}
        search={{
          placeholder: 'Search by title or description...',
          value: search,
          onChange: (value) => { setSearch(value); setPage(1); },
        }}
        dateFilter={{
          value: dateRange,
          onChange: (dates) => { if (dates) { setDateRange(dates); setPage(1); } },
        }}
        actions={{
          onAdd: () => handleOpenModal(),
          onDelete: (record) => setConfirmDelete(record),
          addLabel: 'Add Todo',
          deleteLabel: 'Delete',
          exportLabel: 'Export to Excel',
        }}
        exportFileName="todos"
      />

      {/* Add/Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTodo ? 'Edit Todo' : 'Add Todo'}
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
        <div className="space-y-4">
          <div>
            <label className="label">Title <span className="text-red-500">*</span></label>
            <input type="text" className="input" placeholder="Enter todo title" value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} maxLength={255} />
          </div>
          <div>
            <label className="label">Description <span className="text-red-500">*</span></label>
            <textarea className="input" rows={4} placeholder="Enter todo description" value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status <span className="text-red-500">*</span></label>
              <select className="select" value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Todo['status'] })}>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority <span className="text-red-500">*</span></label>
              <select className="select" value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Todo['priority'] })}>
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Todo"
        message={`Are you sure you want to delete "${confirmDelete?.title}" (ID: ${confirmDelete?.id})?`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
