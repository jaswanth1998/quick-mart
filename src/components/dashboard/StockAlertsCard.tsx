'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Package, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';
import type { StockAlerts } from '@/hooks/useDashboard';

interface Props {
  alerts: StockAlerts;
}

export default function StockAlertsCard({ alerts }: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    lowInventory: true,
    valueStock: true,
    drawerStock: true,
  });

  const totalAlerts =
    alerts.lowInventory.length +
    alerts.valueStockMismatches.length +
    alerts.drawerStockMismatches.length;

  const toggle = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-5 h-5 ${totalAlerts > 0 ? 'text-amber-500' : 'text-green-500'}`} />
          <h3 className="font-semibold text-gray-900">Stock Alerts</h3>
        </div>
        {totalAlerts > 0 && (
          <span className="badge badge-red">{totalAlerts}</span>
        )}
      </div>

      {totalAlerts === 0 ? (
        <div className="px-5 py-8 text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">All clear - no stock alerts</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {/* Low Inventory */}
          {alerts.lowInventory.length > 0 && (
            <div>
              <button
                onClick={() => toggle('lowInventory')}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-900">Low Inventory</span>
                  <span className="badge badge-red">{alerts.lowInventory.length}</span>
                </div>
                {openSections.lowInventory ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {openSections.lowInventory && (
                <div className="px-5 pb-3 space-y-2">
                  {alerts.lowInventory.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs bg-red-50 rounded-lg px-3 py-2">
                      <span className="text-gray-700 truncate mr-2">{item.description}</span>
                      <span className="text-red-600 font-medium whitespace-nowrap">
                        {item.stock} / {item.warning}
                      </span>
                    </div>
                  ))}
                  {alerts.lowInventory.length > 5 && (
                    <Link href="/product" className="text-xs text-blue-600 hover:underline">
                      +{alerts.lowInventory.length - 5} more...
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Value Stock Mismatches */}
          {alerts.valueStockMismatches.length > 0 && (
            <div>
              <button
                onClick={() => toggle('valueStock')}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-900">Value Stock Mismatches</span>
                  <span className="badge badge-orange">{alerts.valueStockMismatches.length}</span>
                </div>
                {openSections.valueStock ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {openSections.valueStock && (
                <div className="px-5 pb-3 space-y-2">
                  {alerts.valueStockMismatches.map((m, i) => (
                    <Link
                      key={i}
                      href={`/shift-report/${m.reportId}`}
                      className="flex items-center justify-between text-xs bg-amber-50 rounded-lg px-3 py-2 hover:bg-amber-100 transition-colors"
                    >
                      <span className="text-gray-700">
                        {m.label} <span className="text-gray-400">({m.shiftType})</span>
                      </span>
                      <span className="text-amber-600 font-medium">
                        Expected: {m.expected} | Actual: {m.actual}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Drawer Stock Mismatches */}
          {alerts.drawerStockMismatches.length > 0 && (
            <div>
              <button
                onClick={() => toggle('drawerStock')}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-900">Drawer Stock Mismatches</span>
                  <span className="badge badge-orange">{alerts.drawerStockMismatches.length}</span>
                </div>
                {openSections.drawerStock ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {openSections.drawerStock && (
                <div className="px-5 pb-3 space-y-2">
                  {alerts.drawerStockMismatches.map((m, i) => (
                    <Link
                      key={i}
                      href={`/shift-report/${m.reportId}`}
                      className="flex items-center justify-between text-xs bg-amber-50 rounded-lg px-3 py-2 hover:bg-amber-100 transition-colors"
                    >
                      <span className="text-gray-700 truncate mr-2">
                        {m.contents} <span className="text-gray-400">({m.shiftType})</span>
                      </span>
                      <span className="text-amber-600 font-medium whitespace-nowrap">
                        Expected: {m.expected} | Actual: {m.actual}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
