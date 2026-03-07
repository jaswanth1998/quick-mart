'use client';

import React, { useState } from 'react';
import { Pencil, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
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

export default function ProductPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange] = useState<[Dayjs, Dayjs]>(() => {
    const [startDate, endDate] = getDefaultDateRange();
    return [dayjs(startDate), dayjs(endDate)];
  });

  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
  const [ageRestrictionFilter, setAgeRestrictionFilter] = useState<string>('');
  const [tax1Filter, setTax1Filter] = useState<string>('');
  const [tax2Filter, setTax2Filter] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    storeId: '',
    department_id: '',
    description: '',
    price: '',
    ageRestriction: false,
    tax1: false,
    tax2: false,
  });
  const [stockData, setStockData] = useState({ stock: '', low_stock_warning: '' });

  const { data: productsData, isLoading } = useProducts({
    search,
    departmentId: selectedDepartment,
    ageRestriction: ageRestrictionFilter ? ageRestrictionFilter === 'true' : undefined,
    tax1: tax1Filter ? tax1Filter === 'true' : undefined,
    tax2: tax2Filter ? tax2Filter === 'true' : undefined,
    stockFilter: stockFilter === 'all' ? undefined : stockFilter,
    startDate: dateRange[0].format('YYYY-MM-DD'),
    endDate: dateRange[1].format('YYYY-MM-DD'),
    page,
    pageSize,
  });

  const { data: departmentsData } = useDepartments({ pageSize: 1000 });
  const deleteMutation = useDeleteProduct();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const updateStockMutation = useUpdateProductStock();

  const columns: DataTableColumn<Product>[] = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a, b) => a.id - b.id },
    { title: 'Store ID', dataIndex: 'storeId', key: 'storeId', width: 100, sorter: (a, b) => a.storeId - b.storeId },
    {
      title: 'Department', dataIndex: 'departments', key: 'department_id', width: 120,
      render: (departments) => (departments as { description?: string } | null)?.description || 'N/A',
    },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Price', dataIndex: 'price', key: 'price', width: 100,
      render: (price) => `$${(price as number).toFixed(2)}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Stock', dataIndex: 'stock', key: 'stock', width: 130,
      render: (_val, record) => {
        const stock = record.stock;
        const color = stock <= 0 ? 'badge-red' : stock < record.low_stock_warning ? 'badge-orange' : 'badge-green';
        return (
          <div className="flex items-center gap-2">
            <span className={color}>{stock}</span>
            <button
              onClick={() => handleOpenStockModal(record)}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
      sorter: (a, b) => a.stock - b.stock,
    },
    {
      title: 'Age Restriction', dataIndex: 'ageRestriction', key: 'ageRestriction', width: 140,
      render: (restricted) =>
        restricted ? (
          <span className="badge-orange"><CheckCircle className="w-3 h-3 mr-1" />Yes</span>
        ) : (
          <span className="badge-green"><XCircle className="w-3 h-3 mr-1" />No</span>
        ),
    },
    {
      title: 'Tax 1', dataIndex: 'tax1', key: 'tax1', width: 80,
      render: (tax) => tax ? <span className="badge-blue">Yes</span> : <span className="badge-gray">No</span>,
    },
    {
      title: 'Tax 2', dataIndex: 'tax2', key: 'tax2', width: 80,
      render: (tax) => tax ? <span className="badge-blue">Yes</span> : <span className="badge-gray">No</span>,
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
      toast.success('Product deleted successfully');
      setConfirmDelete(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        storeId: String(product.storeId),
        department_id: String(product.department_id),
        description: product.description,
        price: String(product.price),
        ageRestriction: product.ageRestriction,
        tax1: product.tax1,
        tax2: product.tax2,
      });
    } else {
      setEditingProduct(null);
      setFormData({ storeId: '', department_id: '', description: '', price: '', ageRestriction: false, tax1: false, tax2: false });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.storeId || !formData.department_id || !formData.description || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const values = {
        storeId: Number(formData.storeId),
        department_id: Number(formData.department_id),
        description: formData.description,
        price: Number(formData.price),
        ageRestriction: formData.ageRestriction,
        tax1: formData.tax1,
        tax2: formData.tax2,
        stock: 0,
        low_stock_warning: 10,
      };

      if (editingProduct) {
        await updateMutation.mutateAsync({ id: editingProduct.id, ...values });
        toast.success('Product updated successfully');
      } else {
        await createMutation.mutateAsync(values);
        toast.success('Product created successfully');
      }
      setIsModalOpen(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    }
  };

  const handleOpenStockModal = (product: Product) => {
    setEditingProduct(product);
    setStockData({ stock: String(product.stock), low_stock_warning: String(product.low_stock_warning) });
    setIsStockModalOpen(true);
  };

  const handleStockSubmit = async () => {
    if (!editingProduct || !stockData.stock) return;
    try {
      await updateStockMutation.mutateAsync({
        id: editingProduct.id,
        stock: Number(stockData.stock),
        low_stock_warning: Number(stockData.low_stock_warning),
      });
      toast.success('Stock updated successfully');
      setIsStockModalOpen(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update stock');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="label">Department</label>
            <select
              className="select w-48"
              value={selectedDepartment ?? ''}
              onChange={(e) => { setSelectedDepartment(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
            >
              <option value="">All Departments</option>
              {departmentsData?.data.map((dept) => (
                <option key={dept.store_id} value={dept.store_id}>{dept.description}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Age Restriction</label>
            <select className="select w-36" value={ageRestrictionFilter} onChange={(e) => { setAgeRestrictionFilter(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="label">Tax 1</label>
            <select className="select w-28" value={tax1Filter} onChange={(e) => { setTax1Filter(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="label">Tax 2</label>
            <select className="select w-28" value={tax2Filter} onChange={(e) => { setTax2Filter(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label className="label">Stock Status</label>
            <select className="select w-36" value={stockFilter} onChange={(e) => { setStockFilter(e.target.value as 'all' | 'low' | 'out'); setPage(1); }}>
              <option value="all">All</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable<Product>
        title="Products"
        columns={columns}
        data={productsData?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total: productsData?.total || 0,
          onChange: (newPage, newPageSize) => { setPage(newPage); setPageSize(newPageSize); },
        }}
        search={{
          placeholder: 'Search by description or store ID...',
          value: search,
          onChange: (value) => { setSearch(value); setPage(1); },
        }}
        exportFileName="products"
      />

      {/* Add/Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
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
            <label className="label">Store ID <span className="text-red-500">*</span></label>
            <input type="number" className="input" placeholder="Enter store ID" value={formData.storeId}
              onChange={(e) => setFormData({ ...formData, storeId: e.target.value })} min={1} />
          </div>
          <div>
            <label className="label">Department <span className="text-red-500">*</span></label>
            <select className="select" value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}>
              <option value="">Select department</option>
              {departmentsData?.data.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.description}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Description <span className="text-red-500">*</span></label>
            <textarea className="input" rows={3} placeholder="Enter product description" value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} maxLength={255} />
          </div>
          <div>
            <label className="label">Price (USD) <span className="text-red-500">*</span></label>
            <input type="number" className="input" placeholder="0.00" step="0.01" min="0" value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.ageRestriction} onChange={(e) => setFormData({ ...formData, ageRestriction: e.target.checked })} />
              <span className="text-sm text-gray-700">Age Restriction</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.tax1} onChange={(e) => setFormData({ ...formData, tax1: e.target.checked })} />
              <span className="text-sm text-gray-700">Tax 1</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.tax2} onChange={(e) => setFormData({ ...formData, tax2: e.target.checked })} />
              <span className="text-sm text-gray-700">Tax 2</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Stock Modal */}
      <Modal
        open={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title="Update Stock"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setIsStockModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleStockSubmit} disabled={updateStockMutation.isPending}>
              {updateStockMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Current Stock <span className="text-red-500">*</span></label>
            <input type="number" className="input" placeholder="Enter stock quantity" min={0}
              value={stockData.stock} onChange={(e) => setStockData({ ...stockData, stock: e.target.value })} />
          </div>
          <div>
            <label className="label">Low Stock Warning Level <span className="text-red-500">*</span></label>
            <input type="number" className="input" placeholder="Enter low stock warning level" min={0}
              value={stockData.low_stock_warning} onChange={(e) => setStockData({ ...stockData, low_stock_warning: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmDelete?.description}" (ID: ${confirmDelete?.id})?`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
