'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, Space, Tag, message } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import {
  useProducts,
  useDeleteProduct,
  useCreateProduct,
  useUpdateProduct,
  Product,
} from '@/hooks/useProducts';
import { useDepartments } from '@/hooks/useDepartments';
import dayjs, { Dayjs } from 'dayjs';
import { getDefaultDateRange, formatDateTime, centsToDollars } from '@/lib/utils';

const { confirm } = Modal;

export default function ProductPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
    const [startDate, endDate] = getDefaultDateRange();
    return [dayjs(startDate), dayjs(endDate)];
  });

  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
  const [ageRestrictionFilter, setAgeRestrictionFilter] = useState<boolean | undefined>();
  const [tax1Filter, setTax1Filter] = useState<boolean | undefined>();
  const [tax2Filter, setTax2Filter] = useState<boolean | undefined>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  // Fetch products with filters
  const { data: productsData, isLoading } = useProducts({
    search,
    departmentId: selectedDepartment,
    ageRestriction: ageRestrictionFilter,
    tax1: tax1Filter,
    tax2: tax2Filter,
    startDate: dateRange[0].format('YYYY-MM-DD'),
    endDate: dateRange[1].format('YYYY-MM-DD'),
    page,
    pageSize,
  });

  // Fetch departments for dropdown
  const { data: departmentsData } = useDepartments({ pageSize: 1000 });

  const deleteMutation = useDeleteProduct();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  // Define table columns
  const columns: DataTableColumn<Product>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Store ID',
      dataIndex: 'storeId',
      key: 'storeId',
      width: 100,
      sorter: (a, b) => a.storeId - b.storeId,
    },
    {
      title: 'Department',
      dataIndex: 'department_id',
      key: 'department_id',
      width: 120,
      render: (deptId: number) => {
        const dept = departmentsData?.data.find((d) => d.id === deptId);
        return dept ? dept.description : `Dept ${deptId}`;
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `$${price.toFixed(2)}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Age Restriction',
      dataIndex: 'ageRestriction',
      key: 'ageRestriction',
      width: 140,
      render: (restricted: boolean) =>
        restricted ? (
          <Tag color="orange" icon={<CheckCircleOutlined />}>
            Yes
          </Tag>
        ) : (
          <Tag color="green" icon={<CloseCircleOutlined />}>
            No
          </Tag>
        ),
    },
    {
      title: 'Tax 1',
      dataIndex: 'tax1',
      key: 'tax1',
      width: 80,
      render: (tax: boolean) =>
        tax ? <Tag color="blue">Yes</Tag> : <Tag>No</Tag>,
    },
    {
      title: 'Tax 2',
      dataIndex: 'tax2',
      key: 'tax2',
      width: 80,
      render: (tax: boolean) =>
        tax ? <Tag color="blue">Yes</Tag> : <Tag>No</Tag>,
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
  const handleDelete = (record: Product) => {
    confirm({
      title: 'Are you sure you want to delete this product?',
      icon: <ExclamationCircleOutlined />,
      content: `Product: ${record.description} (ID: ${record.id})`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(record.id);
          message.success('Product deleted successfully');
        } catch (error: any) {
          message.error(error.message || 'Failed to delete product');
        }
      },
    });
  };

  // Handle add/edit modal
  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      form.setFieldsValue({
        storeId: product.storeId,
        department_id: product.department_id,
        description: product.description,
        price: product.price,
        ageRestriction: product.ageRestriction,
        tax1: product.tax1,
        tax2: product.tax2,
      });
    } else {
      setEditingProduct(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct.id,
          ...values,
        });
        message.success('Product updated successfully');
      } else {
        await createMutation.mutateAsync(values);
        message.success('Product created successfully');
      }

      handleCloseModal();
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(error.message || 'Failed to save product');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Additional Filters */}
      <div style={{ marginBottom: 16, padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
        <Space wrap size="middle">
          <div>
            <label style={{ marginRight: 8, fontWeight: 500 }}>Department:</label>
            <Select
              style={{ width: 200 }}
              placeholder="All Departments"
              allowClear
              value={selectedDepartment}
              onChange={(value) => {
                setSelectedDepartment(value);
                setPage(1);
              }}
              loading={!departmentsData}
            >
              {departmentsData?.data.map((dept) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.description}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <label style={{ marginRight: 8, fontWeight: 500 }}>Age Restriction:</label>
            <Select
              style={{ width: 150 }}
              placeholder="All"
              allowClear
              value={ageRestrictionFilter}
              onChange={(value) => {
                setAgeRestrictionFilter(value);
                setPage(1);
              }}
            >
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </div>

          <div>
            <label style={{ marginRight: 8, fontWeight: 500 }}>Tax 1:</label>
            <Select
              style={{ width: 120 }}
              placeholder="All"
              allowClear
              value={tax1Filter}
              onChange={(value) => {
                setTax1Filter(value);
                setPage(1);
              }}
            >
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </div>

          <div>
            <label style={{ marginRight: 8, fontWeight: 500 }}>Tax 2:</label>
            <Select
              style={{ width: 120 }}
              placeholder="All"
              allowClear
              value={tax2Filter}
              onChange={(value) => {
                setTax2Filter(value);
                setPage(1);
              }}
            >
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </div>
        </Space>
      </div>

      <DataTable<Product>
        title="Products"
        columns={columns}
        data={productsData?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: pageSize,
          total: productsData?.total || 0,
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
          addLabel: 'Add Product',
          deleteLabel: 'Delete',
          exportLabel: 'Export to Excel',
        }}
        exportFileName="products"
      />

      {/* Add/Edit Modal */}
      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
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
            name="storeId"
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
            name="department_id"
            label="Department"
            rules={[{ required: true, message: 'Please select a department!' }]}
          >
            <Select
              placeholder="Select department"
              loading={!departmentsData}
            >
              {departmentsData?.data.map((dept) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.description}
                </Select.Option>
              ))}
            </Select>
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
              placeholder="Enter product description"
            />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price (USD)"
            rules={[
              { required: true, message: 'Please input the price!' },
              { type: 'number', min: 0, message: 'Price must be positive' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="0.00"
              precision={2}
              prefix="$"
            />
          </Form.Item>

          <Form.Item
            name="ageRestriction"
            label="Age Restriction"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Space size="large">
            <Form.Item
              name="tax1"
              label="Tax 1"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>

            <Form.Item
              name="tax2"
              label="Tax 2"
              valuePropName="checked"
              initialValue={false}
            >
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
