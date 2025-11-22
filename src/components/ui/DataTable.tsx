'use client';

import React from 'react';
import { Table, Input, Button, Space, Card, DatePicker, message } from 'antd';
import { SearchOutlined, DeleteOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableProps, ColumnType } from 'antd/es/table';
import * as XLSX from 'xlsx';
import dayjs, { Dayjs } from 'dayjs';
import { getDefaultDateRange } from '@/lib/utils';

const { RangePicker } = DatePicker;

export interface DataTableColumn<T> extends ColumnType<T> {
  dataIndex: string;
  title: string;
  exportable?: boolean; // Whether to include in export
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  search?: {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
  };
  dateFilter?: {
    value?: [Dayjs, Dayjs];
    onChange?: (dates: [Dayjs, Dayjs] | null) => void;
  };
  actions?: {
    onAdd?: () => void;
    onDelete?: (record: T) => void;
    onExport?: () => void;
    addLabel?: string;
    deleteLabel?: string;
    exportLabel?: string;
  };
  exportFileName?: string;
  title?: string;
  rowKey?: string | ((record: T) => string);
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  pagination,
  search,
  dateFilter,
  actions,
  exportFileName = 'export',
  title,
  rowKey = 'id',
}: DataTableProps<T>) {
  const handleExport = () => {
    try {
      // Filter columns that are exportable (default to true if not specified)
      const exportableColumns = columns.filter(
        (col) => col.exportable !== false
      );

      // Prepare data for export
      const exportData = data.map((record) => {
        const row: Record<string, any> = {};
        exportableColumns.forEach((col) => {
          const value = record[col.dataIndex];
          row[col.title] = value !== null && value !== undefined ? value : '';
        });
        return row;
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      // Generate file name with timestamp
      const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
      const fileName = `${exportFileName}_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, fileName);

      message.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export data');
    }
  };

  // Add action column if delete action is provided
  const tableColumns = [...columns];
  if (actions?.onDelete) {
    tableColumns.push({
      title: 'Actions',
      key: 'actions',
      dataIndex: 'actions',
      exportable: false,
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => actions.onDelete?.(record)}
          size="small"
        >
          {actions.deleteLabel || 'Delete'}
        </Button>
      ),
    });
  }

  return (
    <Card title={title}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Filters Row */}
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            {/* Search Input */}
            {search && (
              <Input
                placeholder={search.placeholder || 'Search...'}
                prefix={<SearchOutlined />}
                value={search.value}
                onChange={(e) => search.onChange?.(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
            )}

            {/* Date Range Picker */}
            {dateFilter && (
              <RangePicker
                value={dateFilter.value}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    dateFilter.onChange?.(dates as [Dayjs, Dayjs]);
                  } else {
                    if (dateFilter.onChange) {
                      dateFilter.onChange(null);
                    }
                  }
                }}
                format="YYYY-MM-DD"
                style={{ width: 250 }}
              />
            )}
          </Space>

          {/* Action Buttons */}
          <Space>
            {actions?.onAdd && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={actions.onAdd}
              >
                {actions.addLabel || 'Add New'}
              </Button>
            )}
            <Button
              icon={<DownloadOutlined />}
              onClick={actions?.onExport || handleExport}
              disabled={!data || data.length === 0}
            >
              {actions?.exportLabel || 'Export'}
            </Button>
          </Space>
        </Space>

        {/* Table */}
        <Table<T>
          columns={tableColumns}
          dataSource={data}
          loading={loading}
          rowKey={rowKey}
          pagination={
            pagination
              ? {
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: pagination.total,
                  onChange: pagination.onChange,
                  showSizeChanger: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} items`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                }
              : false
          }
          scroll={{ x: 'max-content' }}
        />
      </Space>
    </Card>
  );
}
