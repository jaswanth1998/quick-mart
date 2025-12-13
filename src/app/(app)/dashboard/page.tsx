'use client';

import { useState } from 'react';
import { Typography, Card, Row, Col, Statistic, DatePicker, Space, Table } from 'antd';
import { ShoppingCartOutlined, CarOutlined, DollarOutlined, TrophyOutlined, WalletOutlined, CalendarOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import dayjs, { Dayjs } from 'dayjs';
import { getDefaultDateRange } from '@/lib/utils';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface AnalyticsData {
  merchandise: {
    totalAmount: number;
    uniqueShifts: number;
  };
  fuel: {
    totalByType: { type: string; total: number; volume: number }[];
  };
  safedrop: {
    totalByShift: { shiftNumber: number; total: number }[];
  };
  lotto: {
    totalByShift: { shiftNumber: number; total: number }[];
  };
  payout: {
    totalByType: { type: string; total: number }[];
  };
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
    const [startDate, endDate] = getDefaultDateRange();
    return [dayjs(startDate), dayjs(endDate)];
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['dashboard-analytics', dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')],
    queryFn: async (): Promise<AnalyticsData> => {
      const supabase = createClient();
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      // Fetch all transactions for the date range
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('dateTime', startDate)
        .lte('dateTime', `${endDate}T23:59:59`);

      if (error) throw new Error(error.message);

      const data = transactions || [];

      // Merchandise analytics
      const merchandiseTransactions = data.filter(t => t.trn_type === 'merchandise');
      const merchandiseTotalAmount = merchandiseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const merchandiseUniqueShifts = new Set(merchandiseTransactions.map(t => t.shiftNumber)).size;

      // Fuel analytics (group by product description)
      const fuelTransactions = data.filter(t => t.trn_type === 'fuel');
      const fuelByType = fuelTransactions.reduce((acc, t) => {
        const type = t.productDescription || 'Unknown';
        if (!acc[type]) acc[type] = { total: 0, volume: 0 };
        acc[type].total += t.amount || 0;
        acc[type].volume += t.volume || 0;
        return acc;
      }, {} as Record<string, { total: number; volume: number }>);
      const fuelTotalByType: { type: string; total: number; volume: number }[] = Object.entries(fuelByType).map(([type, fuelData]) => ({ type, total: (fuelData as { total: number; volume: number }).total, volume: (fuelData as { total: number; volume: number }).volume }));

      // Safe drop analytics (group by shift)
      const safedropTransactions = data.filter(t => t.trn_type === 'safedrop');
      const safedropByShift = safedropTransactions.reduce((acc, t) => {
        if (!acc[t.shiftNumber]) acc[t.shiftNumber] = 0;
        acc[t.shiftNumber] += t.safedrop || 0;
        return acc;
      }, {} as Record<number, number>);
      const safedropTotalByShift = Object.entries(safedropByShift).map(([shift, total]) => ({ 
        shiftNumber: Number(shift), 
        total: total as number
      }));

      // Lotto analytics (group by shift)
      const lottoTransactions = data.filter(t => t.trn_type === 'lotto');
      const lottoByShift = lottoTransactions.reduce((acc, t) => {
        if (!acc[t.shiftNumber]) acc[t.shiftNumber] = 0;
        acc[t.shiftNumber] += t.lotto || 0;
        return acc;
      }, {} as Record<number, number>);
      const lottoTotalByShift = Object.entries(lottoByShift).map(([shift, total]) => ({ 
        shiftNumber: Number(shift), 
        total: total as number
      }));

      // Payout analytics (group by type)
      const payoutTransactions = data.filter(t => t.trn_type === 'payout');
      const payoutByType = payoutTransactions.reduce((acc, t) => {
        const type = t.payout_type || 'Unknown';
        if (!acc[type]) acc[type] = 0;
        acc[type] += t.payout || 0;
        return acc;
      }, {} as Record<string, number>);
      const payoutTotalByType = Object.entries(payoutByType).map(([type, total]) => ({ type, total: total as number }));

      return {
        merchandise: {
          totalAmount: merchandiseTotalAmount,
          uniqueShifts: merchandiseUniqueShifts,
        },
        fuel: {
          totalByType: fuelTotalByType,
        },
        safedrop: {
          totalByShift: safedropTotalByShift,
        },
        lotto: {
          totalByShift: lottoTotalByShift,
        },
        payout: {
          totalByType: payoutTotalByType,
        },
      };
    },
  });

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Dashboard</Title>
          <Space>
            <CalendarOutlined />
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates) {
                  setDateRange(dates as [Dayjs, Dayjs]);
                }
              }}
              format="YYYY-MM-DD"
            />
          </Space>
        </div>

        {/* Merchandise Analytics */}
        <Card title={<><ShoppingCartOutlined /> Merchandise Sales</>} loading={isLoading}>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic 
                title="Total Amount" 
                value={analytics?.merchandise.totalAmount || 0} 
                precision={2}
                prefix="$"
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={12}>
              <Statistic 
                title="Unique Shifts" 
                value={analytics?.merchandise.uniqueShifts || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
          </Row>
        </Card>

        {/* Fuel Sales Analytics */}
        <Card title={<><CarOutlined /> Fuel Sales</>} loading={isLoading}>
          <Table
            dataSource={analytics?.fuel.totalByType || []}
            columns={[
              {
                title: 'Fuel Type',
                dataIndex: 'type',
                key: 'type',
              },
              {
                title: 'Volume (Gallons)',
                dataIndex: 'volume',
                key: 'volume',
                render: (value) => `${value.toFixed(2)}`,
                sorter: (a, b) => a.volume - b.volume,
              },
              {
                title: 'Total Amount',
                dataIndex: 'total',
                key: 'total',
                render: (value) => `$${value.toFixed(2)}`,
                sorter: (a, b) => a.total - b.total,
              },
            ]}
            pagination={false}
            rowKey="type"
            summary={(data) => {
              const totalAmount = data.reduce((sum, item) => sum + item.total, 0);
              const totalVolume = data.reduce((sum, item) => sum + item.volume, 0);
              return (
                <Table.Summary.Row style={{ fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                  <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>{totalVolume.toFixed(2)}</Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>${totalAmount.toFixed(2)}</Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </Card>

        {/* Safe Drop Analytics */}
        <Card title={<><DollarOutlined /> Safe Drops</>} loading={isLoading}>
          <Table
            dataSource={analytics?.safedrop.totalByShift || []}
            columns={[
              {
                title: 'Shift Number',
                dataIndex: 'shiftNumber',
                key: 'shiftNumber',
                sorter: (a, b) => a.shiftNumber - b.shiftNumber,
              },
              {
                title: 'Total Amount',
                dataIndex: 'total',
                key: 'total',
                render: (value) => `$${value.toFixed(2)}`,
                sorter: (a, b) => a.total - b.total,
              },
            ]}
            pagination={false}
            rowKey="shiftNumber"
            summary={(data) => {
              const total = data.reduce((sum, item) => sum + item.total, 0);
              return (
                <Table.Summary.Row style={{ fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                  <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>${total.toFixed(2)}</Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </Card>

        {/* Lotto Analytics */}
        <Card title={<><TrophyOutlined /> Lotto Sales</>} loading={isLoading}>
          <Table
            dataSource={analytics?.lotto.totalByShift || []}
            columns={[
              {
                title: 'Shift Number',
                dataIndex: 'shiftNumber',
                key: 'shiftNumber',
                sorter: (a, b) => a.shiftNumber - b.shiftNumber,
              },
              {
                title: 'Total Amount',
                dataIndex: 'total',
                key: 'total',
                render: (value) => `$${value.toFixed(2)}`,
                sorter: (a, b) => a.total - b.total,
              },
            ]}
            pagination={false}
            rowKey="shiftNumber"
            summary={(data) => {
              const total = data.reduce((sum, item) => sum + item.total, 0);
              return (
                <Table.Summary.Row style={{ fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                  <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>${total.toFixed(2)}</Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </Card>

        {/* Payout Analytics */}
        <Card title={<><WalletOutlined /> Payouts</>} loading={isLoading}>
          <Table
            dataSource={analytics?.payout.totalByType || []}
            columns={[
              {
                title: 'Payout Type',
                dataIndex: 'type',
                key: 'type',
              },
              {
                title: 'Total Amount',
                dataIndex: 'total',
                key: 'total',
                render: (value) => `$${value.toFixed(2)}`,
                sorter: (a, b) => a.total - b.total,
              },
            ]}
            pagination={false}
            rowKey="type"
            summary={(data) => {
              const total = data.reduce((sum, item) => sum + item.total, 0);
              return (
                <Table.Summary.Row style={{ fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                  <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>${total.toFixed(2)}</Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </Card>
      </Space>
    </div>
  );
}
