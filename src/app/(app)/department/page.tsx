'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import {
  useDepartments,
  useDeleteDepartment,
  useCreateDepartment,
  useUpdateDepartment,
  Department,
} from '@/hooks/useDepartments';
import dayjs, { Dayjs } from 'dayjs';
import { getDefaultDateRange, formatDateTime } from '@/lib/utils';

export default function DepartmentPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange] = useState<[Dayjs, Dayjs]>(() => {
    const [startDate, endDate] = getDefaultDateRange();
    return [dayjs(startDate), dayjs(endDate)];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Department | null>(null);
  const toast = useToast();

  // Form state
  const [formStoreId, setFormStoreId] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const { data: departmentsData, isLoading } = useDepartments({
    search,
    startDate: dateRange[0].format('YYYY-MM-DD'),
    endDate: dateRange[1].format('YYYY-MM-DD'),
    page,
    pageSize,
  });

  const deleteMutation = useDeleteDepartment();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();

  const columns: DataTableColumn<Department>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Store ID',
      dataIndex: 'store_id',
      key: 'store_id',
      width: 120,
      sorter: (a, b) => a.store_id - b.store_id,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => formatDateTime(date as string),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
  ];

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync(confirmDelete.id);
      toast.success('Department deleted successfully');
      setConfirmDelete(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete department';
      toast.error(errorMessage);
    }
  };

  const handleOpenModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormStoreId(String(department.store_id));
      setFormDescription(department.description);
    } else {
      setEditingDepartment(null);
      setFormStoreId('');
      setFormDescription('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
    setFormStoreId('');
    setFormDescription('');
  };

  const handleSubmit = async () => {
    if (!formStoreId || !formDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const values = { store_id: Number(formStoreId), description: formDescription };

      if (editingDepartment) {
        await updateMutation.mutateAsync({ id: editingDepartment.id, ...values });
        toast.success('Department updated successfully');
      } else {
        await createMutation.mutateAsync(values);
        toast.success('Department created successfully');
      }
      handleCloseModal();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save department';
      toast.error(errorMessage);
    }
  };

  return (
    <div>
      <DataTable<Department>
        title="Departments"
        columns={columns}
        data={departmentsData?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total: departmentsData?.total || 0,
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
        search={{
          placeholder: 'Search by description or store ID...',
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        exportFileName="departments"
      />

      {/* Add/Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={editingDepartment ? 'Edit Department' : 'Add Department'}
        footer={
          <>
            <button className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : 'Save'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Store ID <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={formStoreId}
              onChange={(e) => setFormStoreId(e.target.value)}
              className="input"
              placeholder="Enter store ID"
              min={1}
            />
          </div>
          <div>
            <label className="label">Description <span className="text-red-500">*</span></label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="input"
              placeholder="Enter department description"
              rows={3}
              maxLength={255}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete "${confirmDelete?.description}" (ID: ${confirmDelete?.id})?`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
