'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, Space, Tag, message, Button } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, EditOutlined } from '@ant-design/icons';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import {
  useProducts,
  useDeleteProduct,
  useCreateProduct,
  useUpdateProduct,
  useUpdateProductStock,
  Product,
} from '@/hooks/useProducts';
import { useDepartments } from '@/hooks/useDepartments';
import dayjs, { Dayjs } from 'dayjs';
import { getDefaultDateRange, formatDateTime } from '@/lib/utils';

const { confirm } = Modal;

export default function ProductPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange] = useState<[Dayjs, Dayjs]>(() => {
    const [startDate, endDate] = getDefaultDateRange();
    return [dayjs(startDate), dayjs(endDate)];
  });

  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
  const [ageRestrictionFilter, setAgeRestrictionFilter] = useState<boolean | undefined>();
  const [tax1Filter, setTax1Filter] = useState<boolean | undefined>();
  const [tax2Filter, setTax2Filter] = useState<boolean | undefined>();
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [stockForm] = Form.useForm();

  // Fetch products with filters
  const { data: productsData, isLoading } = useProducts({
    search,
    departmentId: selectedDepartment,
    ageRestriction: ageRestrictionFilter,
    tax1: tax1Filter,
    tax2: tax2Filter,
    stockFilter: stockFilter === 'all' ? undefined : stockFilter,
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
  const updateStockMutation = useUpdateProductStock();

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
      dataIndex: 'departments',
      key: 'department_id',
      width: 120,
      render: (departments: { description?: string } | null) => {
        return departments?.description || 'N/A';
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
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      width: 120,
      render: (stock: number, record: Product) => {
        let color = 'green';
        if (stock <= 0) {
          color = 'red';
        } else if (stock < record.low_stock_warning) {
          color = 'orange';
        }
        return (
          <Space>
            <Tag color={color}>{stock}</Tag>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenStockModal(record)}
            />
          </Space>
        );
      },
      sorter: (a, b) => a.stock - b.stock,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
          message.error(errorMessage);
        }
      },
    });
  };

  // Handle add/edit modal
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to save product';
      message.error(errorMessage);
    }
  };

  // Handle stock modal
  const handleOpenStockModal = (product: Product) => {
    setEditingProduct(product);
    stockForm.setFieldsValue({
      stock: product.stock,
      low_stock_warning: product.low_stock_warning,
    });
    setIsStockModalOpen(true);
  };

  const handleCloseStockModal = () => {
    setIsStockModalOpen(false);
    setEditingProduct(null);
    stockForm.resetFields();
  };

  const handleStockSubmit = async () => {
    try {
      const values = await stockForm.validateFields();

      if (editingProduct) {
        await updateStockMutation.mutateAsync({
          id: editingProduct.id,
          stock: values.stock,
          low_stock_warning: values.low_stock_warning,
        });
        message.success('Stock updated successfully');
        handleCloseStockModal();
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to update stock';
      message.error(errorMessage);
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
                <Select.Option key={dept.store_id} value={dept.store_id}>
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

          <div>
            <label style={{ marginRight: 8, fontWeight: 500 }}>Stock Status:</label>
            <Select
              style={{ width: 150 }}
              value={stockFilter}
              onChange={(value) => {
                setStockFilter(value);
                setPage(1);
              }}
            >
              <Select.Option value="all">All</Select.Option>
              <Select.Option value="low">Low Stock</Select.Option>
              <Select.Option value="out">Out of Stock</Select.Option>
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

      {/* Stock Update Modal */}
      <Modal
        title="Update Stock"
        open={isStockModalOpen}
        onOk={handleStockSubmit}
        onCancel={handleCloseStockModal}
        confirmLoading={updateStockMutation.isPending}
        okText="Update"
        cancelText="Cancel"
      >
        <Form
          form={stockForm}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="stock"
            label="Current Stock"
            rules={[
              { required: true, message: 'Please input the stock quantity!' },
              { type: 'number', message: 'Stock must be a number' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter stock quantity"
              min={0}
            />
          </Form.Item>

          <Form.Item
            name="low_stock_warning"
            label="Low Stock Warning Level"
            rules={[
              { required: true, message: 'Please input the low stock warning level!' },
              { type: 'number', min: 0, message: 'Warning level must be positive' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter low stock warning level"
              min={0}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
