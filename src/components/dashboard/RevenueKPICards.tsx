'use client';

import { ShoppingCart, Fuel, DollarSign, Trophy, Wallet, TrendingUp } from 'lucide-react';
import type { RevenueData } from '@/hooks/useDashboard';
import type { LucideIcon } from 'lucide-react';

interface Props {
  revenue: RevenueData;
}

interface KPICard {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  subtitle?: string;
}

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RevenueKPICards({ revenue }: Props) {
  const cards: KPICard[] = [
    {
      title: 'Total Sales',
      value: fmt(revenue.totalSales),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      subtitle: 'Merchandise + Fuel',
    },
    {
      title: 'Merchandise',
      value: fmt(revenue.merchandiseSales),
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Fuel Sales',
      value: fmt(revenue.fuelSales),
      icon: Fuel,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      subtitle: `${revenue.fuelVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })} gal`,
    },
    {
      title: 'Safe Drops',
      value: fmt(revenue.safeDrops),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Lotto Sales',
      value: fmt(revenue.lottoSales),
      icon: Trophy,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Payouts',
      value: fmt(revenue.payouts),
      icon: Wallet,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div key={card.title} className="card p-4">
          <div className="flex items-start justify-between mb-2">
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 mb-1">{card.title}</p>
          <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
          {card.subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}
