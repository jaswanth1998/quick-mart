'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import {
  useDepartments,
  useDeleteDepartment,
  useCreateDepartment,
  useUpdateDepartment,
  Department,
} from '@/hooks/useDepartments';
import dayjs, { Dayjs } from 'dayjs';
import { getDefaultDateRange, formatDateTime } from '@/lib/utils';

const { confirm } = Modal;

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
  const [form] = Form.useForm();

  // Fetch departments with filters
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

  // Define table columns
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
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
  ];

  // Handle delete
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDelete = (record: Department) => {
    confirm({
      title: 'Are you sure you want to delete this department?',
      icon: <ExclamationCircleOutlined />,
      content: `Department: ${record.description} (ID: ${record.id})`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(record.id);
          message.success('Department deleted successfully');
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete department';
          message.error(errorMessage);
        }
      },
    });
  };

  // Handle add/edit modal
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleOpenModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      form.setFieldsValue({
        store_id: department.store_id,
        description: department.description,
      });
    } else {
      setEditingDepartment(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingDepartment) {
        // Update existing department
        await updateMutation.mutateAsync({
          id: editingDepartment.id,
          ...values,
        });
        message.success('Department updated successfully');
      } else {
        // Create new department
        await createMutation.mutateAsync(values);
        message.success('Department created successfully');
      }

      handleCloseModal();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // Form validation error
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to save department';
      message.error(errorMessage);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <DataTable<Department>
        title="Departments"
        columns={columns}
        data={departmentsData?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: pageSize,
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
            setPage(1); // Reset to first page on search
          },
        }}
        // dateFilter={{
        //   value: dateRange,
        //   onChange: (dates) => {
        //     if (dates) {
        //       setDateRange(dates);
        //       setPage(1); // Reset to first page on date change
        //     }
        //   },
        // }}
        // actions={{
        //   onAdd: () => handleOpenModal(),
        //   onDelete: handleDelete,
        //   addLabel: 'Add Department',
        //   deleteLabel: 'Delete',
        //   exportLabel: 'Export to Excel',
        // }}
        exportFileName="departments"
      />

      {/* Add/Edit Modal */}
      <Modal
        title={editingDepartment ? 'Edit Department' : 'Add Department'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText="Save"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="store_id"
            label="Store ID"
            rules={[
              { required: true, message: 'Please input the store ID!' },
              { type: 'number', min: 1, message: 'Store ID must be greater than 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter store ID"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please input the description!' },
              { max: 255, message: 'Description must be less than 255 characters' },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter department description"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
