'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Space, Tag, message } from 'antd';
import { ExclamationCircleOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import {
  useTodos,
  useDeleteTodo,
  useCreateTodo,
  useUpdateTodo,
  Todo,
} from '@/hooks/useTodos';
import dayjs, { Dayjs } from 'dayjs';
import { getDefaultDateRange, formatDateTime, formatDate } from '@/lib/utils';

const { confirm } = Modal;
const { TextArea } = Input;

// Status and Priority options
const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending', color: 'default' },
  { label: 'In Progress', value: 'in_progress', color: 'processing' },
  { label: 'Completed', value: 'completed', color: 'success' },
  { label: 'Archived', value: 'archived', color: 'error' },
];

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low', color: 'blue' },
  { label: 'Medium', value: 'medium', color: 'orange' },
  { label: 'High', value: 'high', color: 'red' },
];

export default function TodoPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
    const [startDate, endDate] = getDefaultDateRange();
    return [dayjs(startDate), dayjs(endDate)];
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [form] = Form.useForm();

  // Fetch todos with filters
  const { data: todosData, isLoading } = useTodos({
    search,
    status: statusFilter,
    priority: priorityFilter,
    startDate: dateRange[0].format('YYYY-MM-DD'),
    endDate: dateRange[1].format('YYYY-MM-DD'),
    page,
    pageSize,
  });

  const deleteMutation = useDeleteTodo();
  const createMutation = useCreateTodo();
  const updateMutation = useUpdateTodo();

  // Define table columns
  const columns: DataTableColumn<Todo>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: Todo) => (
        <a onClick={() => handleOpenModal(record)} style={{ fontWeight: 500 }}>
          {title}
        </a>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => {
        const option = STATUS_OPTIONS.find((opt) => opt.value === status);
        return (
          <Tag color={option?.color} icon={status === 'completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}>
            {option?.label || status}
          </Tag>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const option = PRIORITY_OPTIONS.find((opt) => opt.value === priority);
        return <Tag color={option?.color}>{option?.label || priority}</Tag>;
      },
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (date: string) => (date ? formatDate(date) : '-'),
      sorter: (a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      },
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
  const handleDelete = (record: Todo) => {
    confirm({
      title: 'Are you sure you want to delete this todo?',
      icon: <ExclamationCircleOutlined />,
      content: `Todo: ${record.title} (ID: ${record.id})`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(record.id);
          message.success('Todo deleted successfully');
        } catch (error: any) {
          message.error(error.message || 'Failed to delete todo');
        }
      },
    });
  };

  // Handle add/edit modal
  const handleOpenModal = (todo?: Todo) => {
    if (todo) {
      setEditingTodo(todo);
      form.setFieldsValue({
        title: todo.title,
        description: todo.description,
        status: todo.status,
        priority: todo.priority,
        due_date: todo.due_date ? dayjs(todo.due_date) : null,
      });
    } else {
      setEditingTodo(null);
      form.resetFields();
      form.setFieldsValue({
        status: 'pending',
        priority: 'medium',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTodo(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const todoData = {
        ...values,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
      };

      if (editingTodo) {
        await updateMutation.mutateAsync({
          id: editingTodo.id,
          ...todoData,
        });
        message.success('Todo updated successfully');
      } else {
        await createMutation.mutateAsync(todoData);
        message.success('Todo created successfully');
      }

      handleCloseModal();
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(error.message || 'Failed to save todo');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Additional Filters */}
      <div style={{ marginBottom: 16, padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
        <Space wrap size="middle">
          <div>
            <label style={{ marginRight: 8, fontWeight: 500 }}>Status:</label>
            <Select
              style={{ width: 150 }}
              placeholder="All Status"
              allowClear
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <label style={{ marginRight: 8, fontWeight: 500 }}>Priority:</label>
            <Select
              style={{ width: 150 }}
              placeholder="All Priorities"
              allowClear
              value={priorityFilter}
              onChange={(value) => {
                setPriorityFilter(value);
                setPage(1);
              }}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </div>
        </Space>
      </div>

      <DataTable<Todo>
        title="Todos"
        columns={columns}
        data={todosData?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: pageSize,
          total: todosData?.total || 0,
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
        search={{
          placeholder: 'Search by title or description...',
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        dateFilter={{
          value: dateRange,
          onChange: (dates) => {
            if (dates) {
              setDateRange(dates);
              setPage(1);
            }
          },
        }}
        actions={{
          onAdd: () => handleOpenModal(),
          onDelete: handleDelete,
          addLabel: 'Add Todo',
          deleteLabel: 'Delete',
          exportLabel: 'Export to Excel',
        }}
        exportFileName="todos"
      />

      {/* Add/Edit Modal */}
      <Modal
        title={editingTodo ? 'Edit Todo' : 'Add Todo'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText="Save"
        cancelText="Cancel"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: 'Please input the title!' },
              { max: 255, message: 'Title must be less than 255 characters' },
            ]}
          >
            <Input placeholder="Enter todo title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please input the description!' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Enter todo description"
            />
          </Form.Item>

          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Please select a status!' }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Select placeholder="Select status">
                {STATUS_OPTIONS.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true, message: 'Please select a priority!' }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Select placeholder="Select priority">
                {PRIORITY_OPTIONS.map((option) => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Space>

          <Form.Item
            name="due_date"
            label="Due Date"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
