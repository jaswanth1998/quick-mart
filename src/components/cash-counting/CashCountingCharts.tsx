'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { CashCountingAnalytics } from '@/hooks/useCashCounting';

interface CashCountingChartsProps {
  analytics: CashCountingAnalytics | undefined;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function CashCountingCharts({ analytics }: CashCountingChartsProps) {
  if (!analytics || analytics.trends.length === 0) {
    return (
      <div className="col-span-2 card p-12 text-center">
        <p className="text-gray-500">No data available for charts</p>
      </div>
    );
  }

  const { trends, shiftAnalysis, breakdown } = analytics;

  // Prepare pie chart data (top 6 denominations)
  const pieData = breakdown
    .filter(d => d.totalValue > 0)
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 6)
    .map(d => ({
      name: d.label,
      value: d.totalValue,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Line Chart: Total Amount Over Time */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Total Cash Over Time</h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : '0.00'}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalAmount"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Total Amount"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart: Remaining by Shift */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Remaining Cash by Shift</h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={shiftAnalysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="shiftType"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : '0.00'}`}
              />
              <Legend />
              <Bar
                dataKey="avgRemaining"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
                name="Avg Remaining"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart: Denomination Breakdown */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Denomination Breakdown</h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${((entry.value / pieData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : '0.00'}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Area Chart: Sale Drop vs Remaining Trend */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Sale Drop vs Remaining Trend</h3>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : '0.00'}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="saleDrop"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Sale Drop"
              />
              <Area
                type="monotone"
                dataKey="remaining"
                stackId="1"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
                name="Remaining"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
