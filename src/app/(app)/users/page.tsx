'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useUsers, useCreateUser, useUpdateUser, useDeactivateUser, useChangePassword, UserProfile } from '@/hooks/useUsers';
import { useUserRole } from '@/hooks/useUserRole';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { formatDateTime } from '@/lib/utils';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<UserProfile | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    phone: '',
    role: 'user' as 'admin' | 'user',
    is_active: true,
  });
  const toast = useToast();
  const { profile } = useUserRole();
  const { isLoading: adminLoading } = useRequireAdmin();
  const { data: usersData, isLoading } = useUsers({ search, page, pageSize });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deactivateMutation = useDeactivateUser();
  const changePasswordMutation = useChangePassword();

  if (adminLoading) return null;

  const handleOpenModal = (user?: UserProfile) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        username: user.username || '',
        phone: user.phone || '',
        role: user.role,
        is_active: user.is_active,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        username: '',
        phone: '',
        role: 'user',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    try {
      if (editingUser) {
        await updateMutation.mutateAsync({
          id: editingUser.id,
          username: formData.username,
          phone: formData.phone || null,
          role: formData.role,
          is_active: formData.is_active,
        });
        toast.success('User updated successfully');
      } else {
        if (!formData.password || formData.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          return;
        }
        if (!formData.username) {
          toast.error('Username is required');
          return;
        }
        await createMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          phone: formData.phone || undefined,
          role: formData.role,
        });
        toast.success('User created successfully');
      }
      handleCloseModal();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save user');
    }
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(confirmDeactivate.id);
      toast.success('User deactivated successfully');
      setConfirmDeactivate(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate user');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({
        userId: passwordUser.id,
        newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordUser(null);
      setNewPassword('');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    }
  };

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
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
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
      width: 220,
      exportable: false,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(record)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => { setPasswordUser(record); setNewPassword(''); }}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium"
          >
            Password
          </button>
          {record.is_active && record.id !== profile?.id && (
            <button
              onClick={() => setConfirmDeactivate(record)}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Deactivate
            </button>
          )}
        </div>
      ),
    },
  ];

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
          placeholder: 'Search by email, username, or phone...',
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        actions={{
          onAdd: () => handleOpenModal(),
          addLabel: 'Add User',
        }}
        exportFileName="users"
      />

      {/* Create / Edit User Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={editingUser ? 'Edit User' : 'Add User'}
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
            <label className="label">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              className={`input ${editingUser ? 'bg-gray-50' : ''}`}
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!editingUser}
            />
          </div>

          {!editingUser && (
            <div>
              <label className="label">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                className="input"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="label">Username {!editingUser && <span className="text-red-500">*</span>}</label>
            <input
              type="text"
              className="input"
              placeholder="Enter username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              className="input"
              placeholder="Enter phone number (optional)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Role</label>
            <select
              className="select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {editingUser && (
            <div>
              <label className="label">Status</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: true })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    formData.is_active
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: false })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    !formData.is_active
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        open={!!passwordUser}
        onClose={() => { setPasswordUser(null); setNewPassword(''); }}
        title="Change Password"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setPasswordUser(null); setNewPassword(''); }}>Cancel</button>
            <button
              className="btn-primary"
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : 'Change Password'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">User</label>
            <input
              type="text"
              className="input bg-gray-50"
              value={passwordUser?.email || ''}
              disabled
            />
          </div>
          <div>
            <label className="label">New Password <span className="text-red-500">*</span></label>
            <input
              type="password"
              className="input"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <ConfirmModal
        open={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={handleDeactivate}
        title="Deactivate User"
        message={`Are you sure you want to deactivate "${confirmDeactivate?.email}"? They will no longer be able to log in.`}
        confirmText="Deactivate"
        loading={deactivateMutation.isPending}
      />
    </div>
  );
}
