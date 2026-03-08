'use client';

import React, { useState } from 'react';
import { ShoppingCart, Car, DollarSign, Trophy, Wallet } from 'lucide-react';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { DataTable, DataTableColumn } from '@/components/ui/DataTable';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import dayjs, { Dayjs } from 'dayjs';
import { getDefaultDateRange, formatDateTime } from '@/lib/utils';

type TabKey = 'merchandise' | 'fuel' | 'safedrop' | 'lotto' | 'payout';

const tabs: { key: TabKey; label: string; icon: typeof ShoppingCart }[] = [
  { key: 'merchandise', label: 'Merchandise', icon: ShoppingCart },
  { key: 'fuel', label: 'Fuel Sales', icon: Car },
  { key: 'safedrop', label: 'Safe Drops', icon: DollarSign },
  { key: 'lotto', label: 'Lotto', icon: Trophy },
  { key: 'payout', label: 'Payouts', icon: Wallet },
];

export default function TransactionPage() {
  const { isLoading: adminLoading } = useRequireAdmin();
  const [activeTab, setActiveTab] = useState<TabKey>('merchandise');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
    const [startDate, endDate] = getDefaultDateRange();
    return [dayjs(startDate), dayjs(endDate)];
  });

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

  if (adminLoading) return null;

  const commonColumns: DataTableColumn<Transaction>[] = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a, b) => a.id - b.id },
    { title: 'Shift #', dataIndex: 'shiftNumber', key: 'shiftNumber', width: 100, sorter: (a, b) => a.shiftNumber - b.shiftNumber },
    { title: 'Product ID', dataIndex: 'productId', key: 'productId', width: 100 },
    { title: 'Product Description', dataIndex: 'productDescription', key: 'productDescription', ellipsis: true },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100, sorter: (a, b) => a.quantity - b.quantity },
    {
      title: 'Amount', dataIndex: 'amount', key: 'amount', width: 120,
      render: (amount) => <span className="font-semibold text-green-600">${(amount as number).toFixed(2)}</span>,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Date & Time', dataIndex: 'dateTime', key: 'dateTime', width: 180,
      render: (date) => formatDateTime(date as string),
      sorter: (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    },
  ];

  const fuelColumns: DataTableColumn<Transaction>[] = [
    ...commonColumns,
    {
      title: 'Gas Type', dataIndex: 'typeOfGas', key: 'typeOfGas', width: 120,
      render: (type) => type ? <span className="badge-blue">{type as string}</span> : '-',
    },
    {
      title: 'Volume (L)', dataIndex: 'volume', key: 'volume', width: 120,
      render: (volume) => volume ? (volume as number).toFixed(2) : '-',
      sorter: (a, b) => (a.volume || 0) - (b.volume || 0),
    },
    {
      title: 'Pump', dataIndex: 'pump', key: 'pump', width: 100,
      render: (pump) => pump ? `#${pump}` : '-',
    },
  ];

  const safedropColumns: DataTableColumn<Transaction>[] = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a, b) => a.id - b.id },
    { title: 'Shift #', dataIndex: 'shiftNumber', key: 'shiftNumber', width: 100, sorter: (a, b) => a.shiftNumber - b.shiftNumber },
    { title: 'Description', dataIndex: 'productDescription', key: 'productDescription', width: 150 },
    {
      title: 'Safe Drop Amount', dataIndex: 'safedrop', key: 'safedrop', width: 150,
      render: (safedrop) => <span className="font-bold text-blue-600 text-base">${(safedrop as number)?.toFixed(2) || '0.00'}</span>,
      sorter: (a, b) => (a.safedrop || 0) - (b.safedrop || 0),
    },
    {
      title: 'Date & Time', dataIndex: 'dateTime', key: 'dateTime', width: 180,
      render: (date) => formatDateTime(date as string),
      sorter: (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    },
  ];

  const lottoColumns: DataTableColumn<Transaction>[] = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a, b) => a.id - b.id },
    { title: 'Shift #', dataIndex: 'shiftNumber', key: 'shiftNumber', width: 100, sorter: (a, b) => a.shiftNumber - b.shiftNumber },
    { title: 'Product ID', dataIndex: 'productId', key: 'productId', width: 100 },
    { title: 'Description', dataIndex: 'productDescription', key: 'productDescription', width: 150 },
    {
      title: 'Lotto Amount', dataIndex: 'lotto', key: 'lotto', width: 150,
      render: (lotto) => <span className="font-bold text-green-600 text-base">${(lotto as number)?.toFixed(2) || '0.00'}</span>,
      sorter: (a, b) => (a.lotto || 0) - (b.lotto || 0),
    },
    {
      title: 'Date & Time', dataIndex: 'dateTime', key: 'dateTime', width: 180,
      render: (date) => formatDateTime(date as string),
      sorter: (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    },
  ];

  const payoutColumns: DataTableColumn<Transaction>[] = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a, b) => a.id - b.id },
    { title: 'Shift #', dataIndex: 'shiftNumber', key: 'shiftNumber', width: 100, sorter: (a, b) => a.shiftNumber - b.shiftNumber },
    {
      title: 'Payout Type', dataIndex: 'payout_type', key: 'payout_type', width: 200,
      render: (type) => type ? <span className="badge-purple">{type as string}</span> : '-',
    },
    {
      title: 'Payout Amount', dataIndex: 'payout', key: 'payout', width: 150,
      render: (payout) => <span className="font-bold text-red-600 text-base">${(payout as number)?.toFixed(2) || '0.00'}</span>,
      sorter: (a, b) => (a.payout || 0) - (b.payout || 0),
    },
    {
      title: 'Date & Time', dataIndex: 'dateTime', key: 'dateTime', width: 180,
      render: (date) => formatDateTime(date as string),
      sorter: (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    },
  ];

  const columnsByTab: Record<TabKey, DataTableColumn<Transaction>[]> = {
    merchandise: commonColumns,
    fuel: fuelColumns,
    safedrop: safedropColumns,
    lotto: lottoColumns,
    payout: payoutColumns,
  };

  const searchPlaceholders: Record<TabKey, string> = {
    merchandise: 'Search by product, shift number, or product ID...',
    fuel: 'Search by product, shift number, or product ID...',
    safedrop: 'Search by shift number...',
    lotto: 'Search by product ID or shift number...',
    payout: 'Search by payout type or shift number...',
  };

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setPage(1);
    setSearch('');
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto px-4" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                    ${isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <DataTable<Transaction>
        columns={columnsByTab[activeTab]}
        data={transactionsData?.data || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total: transactionsData?.total || 0,
          onChange: (newPage, newPageSize) => { setPage(newPage); setPageSize(newPageSize); },
        }}
        search={{
          placeholder: searchPlaceholders[activeTab],
          value: search,
          onChange: (value) => { setSearch(value); setPage(1); },
        }}
        dateFilter={{
          value: dateRange,
          onChange: (dates) => { if (dates) { setDateRange(dates); setPage(1); } },
        }}
        actions={{ exportLabel: 'Export to Excel' }}
        exportFileName={`${activeTab}_transactions_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}`}
      />
    </div>
  );
}
