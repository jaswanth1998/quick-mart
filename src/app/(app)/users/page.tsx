'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useUsers, useUpdateUser, UserProfile } from '@/hooks/useUsers';
import { useUserRole } from '@/hooks/useUserRole';
import { formatDateTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formRole, setFormRole] = useState<'admin' | 'user'>('user');
  const [formActive, setFormActive] = useState(true);
  const toast = useToast();
  const router = useRouter();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const { data: usersData, isLoading } = useUsers({ search, page, pageSize });
  const updateMutation = useUpdateUser();

  // Redirect non-admins
  if (!roleLoading && !isAdmin) {
    router.push('/dashboard');
    return null;
  }

  const columns: DataTableColumn<UserProfile>[] = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (value) => (value as string) || '-',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (value) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${
          value === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {value as string}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (value) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
          value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => formatDateTime(date as string),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Actions',
      dataIndex: 'id',
      key: 'actions',
      width: 100,
      exportable: false,
      render: (_, record) => (
        <button
          onClick={() => handleOpenEdit(record)}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Edit
        </button>
      ),
    },
  ];

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormRole(user.role);
    setFormActive(user.is_active);
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      await updateMutation.mutateAsync({
        id: editingUser.id,
        role: formRole,
        is_active: formActive,
      });
      toast.success('User updated successfully');
      handleCloseEdit();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      toast.error(errorMessage);
    }
  };

  return (
    <div>
      <DataTable<UserProfile>
        title="User Management"
        columns={columns}
        data={usersData?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total: usersData?.total || 0,
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
        search={{
          placeholder: 'Search by email or username...',
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        exportFileName="users"
      />

      {/* Edit User Modal */}
      <Modal
        open={!!editingUser}
        onClose={handleCloseEdit}
        title="Edit User"
        footer={
          <>
            <button className="btn-secondary" onClick={handleCloseEdit}>Cancel</button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : 'Save'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="text"
              value={editingUser?.email || ''}
              className="input bg-gray-50"
              disabled
            />
          </div>
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              value={editingUser?.username || ''}
              className="input bg-gray-50"
              disabled
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as 'admin' | 'user')}
              className="select"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormActive(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  formActive
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setFormActive(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  !formActive
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
