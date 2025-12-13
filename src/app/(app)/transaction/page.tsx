'use client';

import React, { useState } from 'react';
import { Tabs, Tag } from 'antd';
import { ShoppingCartOutlined, CarOutlined, DollarOutlined, TrophyOutlined, WalletOutlined } from '@ant-design/icons';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import dayjs, { Dayjs } from 'dayjs';
import { getDefaultDateRange, formatDateTime } from '@/lib/utils';

export default function TransactionPage() {
  const [activeTab, setActiveTab] = useState<'merchandise' | 'fuel' | 'safedrop' | 'lotto' | 'payout'>('merchandise');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
    const [startDate, endDate] = getDefaultDateRange();
    return [dayjs(startDate), dayjs(endDate)];
  });

  // Fetch transactions based on active tab
  const { data: transactionsData, isLoading } = useTransactions({
    search,
    isGasTrn: activeTab === 'fuel' ? true : activeTab === 'merchandise' ? false : undefined,
    isSafeDrop: activeTab === 'safedrop',
    isLotto: activeTab === 'lotto',
    isPayout: activeTab === 'payout',
    startDate: dateRange[0].format('YYYY-MM-DD'),
    endDate: dateRange[1].format('YYYY-MM-DD'),
    page,
    pageSize,
  });

  // Common columns for both tabs
  const commonColumns: DataTableColumn<Transaction>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Shift #',
      dataIndex: 'shiftNumber',
      key: 'shiftNumber',
      width: 100,
      sorter: (a, b) => a.shiftNumber - b.shiftNumber,
    },
    {
      title: 'Product ID',
      dataIndex: 'productId',
      key: 'productId',
      width: 100,
    },
    {
      title: 'Product Description',
      dataIndex: 'productDescription',
      key: 'productDescription',
      ellipsis: true,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <span style={{ fontWeight: 500, color: '#52c41a' }}>
          ${amount.toFixed(2)}
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Date & Time',
      dataIndex: 'dateTime',
      key: 'dateTime',
      width: 180,
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    },
  ];

  // Fuel-specific columns
  const fuelColumns: DataTableColumn<Transaction>[] = [
    ...commonColumns,
    {
      title: 'Gas Type',
      dataIndex: 'typeOfGas',
      key: 'typeOfGas',
      width: 120,
      render: (type: string) => type ? <Tag color="blue">{type}</Tag> : '-',
    },
    {
      title: 'Volume (L)',
      dataIndex: 'volume',
      key: 'volume',
      width: 120,
      render: (volume: number) => volume ? volume.toFixed(2) : '-',
      sorter: (a, b) => (a.volume || 0) - (b.volume || 0),
    },
    {
      title: 'Pump',
      dataIndex: 'pump',
      key: 'pump',
      width: 100,
      render: (pump: number) => pump ? `#${pump}` : '-',
    },
  ];

  const handleTabChange = (key: string) => {
    setActiveTab(key as 'merchandise' | 'fuel' | 'safedrop' | 'lotto' | 'payout');
    setPage(1); // Reset pagination when switching tabs
    setSearch(''); // Clear search when switching tabs
  };

  const resetFilters = () => {
    setPage(1);
  };

  const tabItems = [
    {
      key: 'merchandise',
      label: (
        <span>
          <ShoppingCartOutlined /> Merchandise Sales
        </span>
      ),
      children: (
        <DataTable<Transaction>
          columns={commonColumns}
          data={transactionsData?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: transactionsData?.total || 0,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
          search={{
            placeholder: 'Search by product, shift number, or product ID...',
            value: search,
            onChange: (value) => {
              setSearch(value);
              resetFilters();
            },
          }}
          dateFilter={{
            value: dateRange,
            onChange: (dates) => {
              if (dates) {
                setDateRange(dates);
                resetFilters();
              }
            },
          }}
          actions={{
            exportLabel: 'Export to Excel',
          }}
          exportFileName={`merchandise_transactions_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}`}
        />
      ),
    },
    {
      key: 'fuel',
      label: (
        <span>
          <CarOutlined /> Fuel Sales
        </span>
      ),
      children: (
        <DataTable<Transaction>
          columns={fuelColumns}
          data={transactionsData?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: transactionsData?.total || 0,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
          search={{
            placeholder: 'Search by product, shift number, or product ID...',
            value: search,
            onChange: (value) => {
              setSearch(value);
              resetFilters();
            },
          }}
          dateFilter={{
            value: dateRange,
            onChange: (dates) => {
              if (dates) {
                setDateRange(dates);
                resetFilters();
              }
            },
          }}
          actions={{
            exportLabel: 'Export to Excel',
          }}
          exportFileName={`fuel_transactions_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}`}
        />
      ),
    },
    {
      key: 'safedrop',
      label: (
        <span>
          <DollarOutlined /> Safe Drops
        </span>
      ),
      children: (
        <DataTable<Transaction>
          columns={[
            {
              title: 'ID',
              dataIndex: 'id',
              key: 'id',
              width: 80,
              sorter: (a, b) => a.id - b.id,
            },
            {
              title: 'Shift #',
              dataIndex: 'shiftNumber',
              key: 'shiftNumber',
              width: 100,
              sorter: (a, b) => a.shiftNumber - b.shiftNumber,
            },
            {
              title: 'Description',
              dataIndex: 'productDescription',
              key: 'productDescription',
              width: 150,
            },
            {
              title: 'Safe Drop Amount',
              dataIndex: 'safedrop',
              key: 'safedrop',
              width: 150,
              render: (safedrop: number) => (
                <span style={{ fontWeight: 600, color: '#1890ff', fontSize: '16px' }}>
                  ${safedrop?.toFixed(2) || '0.00'}
                </span>
              ),
              sorter: (a, b) => (a.safedrop || 0) - (b.safedrop || 0),
            },
            {
              title: 'Date & Time',
              dataIndex: 'dateTime',
              key: 'dateTime',
              width: 180,
              render: (date: string) => formatDateTime(date),
              sorter: (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
            },
          ]}
          data={transactionsData?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: transactionsData?.total || 0,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
          search={{
            placeholder: 'Search by shift number...',
            value: search,
            onChange: (value) => {
              setSearch(value);
              resetFilters();
            },
          }}
          dateFilter={{
            value: dateRange,
            onChange: (dates) => {
              if (dates) {
                setDateRange(dates);
                resetFilters();
              }
            },
          }}
          actions={{
            exportLabel: 'Export to Excel',
          }}
          exportFileName={`safe_drops_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}`}
        />
      ),
    },
    {
      key: 'lotto',
      label: (
        <span>
          <TrophyOutlined /> Lotto
        </span>
      ),
      children: (
        <DataTable<Transaction>
          columns={[
            {
              title: 'ID',
              dataIndex: 'id',
              key: 'id',
              width: 80,
              sorter: (a, b) => a.id - b.id,
            },
            {
              title: 'Shift #',
              dataIndex: 'shiftNumber',
              key: 'shiftNumber',
              width: 100,
              sorter: (a, b) => a.shiftNumber - b.shiftNumber,
            },
            {
              title: 'Product ID',
              dataIndex: 'productId',
              key: 'productId',
              width: 100,
            },
            {
              title: 'Description',
              dataIndex: 'productDescription',
              key: 'productDescription',
              width: 150,
            },
            {
              title: 'Lotto Amount',
              dataIndex: 'lotto',
              key: 'lotto',
              width: 150,
              render: (lotto: number) => (
                <span style={{ fontWeight: 600, color: '#52c41a', fontSize: '16px' }}>
                  ${lotto?.toFixed(2) || '0.00'}
                </span>
              ),
              sorter: (a, b) => (a.lotto || 0) - (b.lotto || 0),
            },
            {
              title: 'Date & Time',
              dataIndex: 'dateTime',
              key: 'dateTime',
              width: 180,
              render: (date: string) => formatDateTime(date),
              sorter: (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
            },
          ]}
          data={transactionsData?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: transactionsData?.total || 0,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
          search={{
            placeholder: 'Search by product ID or shift number...',
            value: search,
            onChange: (value) => {
              setSearch(value);
              resetFilters();
            },
          }}
          dateFilter={{
            value: dateRange,
            onChange: (dates) => {
              if (dates) {
                setDateRange(dates);
                resetFilters();
              }
            },
          }}
          actions={{
            exportLabel: 'Export to Excel',
          }}
          exportFileName={`lotto_transactions_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}`}
        />
      ),
    },
    {
      key: 'payout',
      label: (
        <span>
          <WalletOutlined /> Payouts
        </span>
      ),
      children: (
        <DataTable<Transaction>
          columns={[
            {
              title: 'ID',
              dataIndex: 'id',
              key: 'id',
              width: 80,
              sorter: (a, b) => a.id - b.id,
            },
            {
              title: 'Shift #',
              dataIndex: 'shiftNumber',
              key: 'shiftNumber',
              width: 100,
              sorter: (a, b) => a.shiftNumber - b.shiftNumber,
            },
            {
              title: 'Payout Type',
              dataIndex: 'payout_type',
              key: 'payout_type',
              width: 200,
              render: (type: string) => type ? <Tag color="purple">{type}</Tag> : '-',
            },
            {
              title: 'Payout Amount',
              dataIndex: 'payout',
              key: 'payout',
              width: 150,
              render: (payout: number) => (
                <span style={{ fontWeight: 600, color: '#f5222d', fontSize: '16px' }}>
                  ${payout?.toFixed(2) || '0.00'}
                </span>
              ),
              sorter: (a, b) => (a.payout || 0) - (b.payout || 0),
            },
            {
              title: 'Date & Time',
              dataIndex: 'dateTime',
              key: 'dateTime',
              width: 180,
              render: (date: string) => formatDateTime(date),
              sorter: (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
            },
          ]}
          data={transactionsData?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: transactionsData?.total || 0,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
          search={{
            placeholder: 'Search by payout type or shift number...',
            value: search,
            onChange: (value) => {
              setSearch(value);
              resetFilters();
            },
          }}
          dateFilter={{
            value: dateRange,
            onChange: (dates) => {
              if (dates) {
                setDateRange(dates);
                resetFilters();
              }
            },
          }}
          actions={{
            exportLabel: 'Export to Excel',
          }}
          exportFileName={`payout_transactions_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}`}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        size="large"
      />
    </div>
  );
}
