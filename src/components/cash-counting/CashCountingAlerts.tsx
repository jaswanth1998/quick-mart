'use client';

import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { generateAlerts } from '@/lib/cash-counting-utils';
import type { CashCountingEntry } from '@/lib/cash-counting-utils';

interface CashCountingAlertsProps {
  entries: CashCountingEntry[];
}

export default function CashCountingAlerts({ entries }: CashCountingAlertsProps) {
  const alerts = generateAlerts(entries);

  const getAlertIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getAlertColor = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return 'border-l-red-400 bg-red-50';
      case 'warning':
        return 'border-l-orange-400 bg-orange-50';
      case 'info':
        return 'border-l-blue-400 bg-blue-50';
    }
  };

  const getTextColor = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-orange-700';
      case 'info':
        return 'text-blue-700';
    }
  };

  const errorAlerts = alerts.filter(a => a.type === 'error');
  const warningAlerts = alerts.filter(a => a.type === 'warning');
  const infoAlerts = alerts.filter(a => a.type === 'info');

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Alerts & Exceptions ({alerts.length})
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">Issues that need attention</p>
      </div>

      <div className="p-6">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">
              No alerts. All entries are in good standing!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Error Alerts */}
            {errorAlerts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                  Errors ({errorAlerts.length})
                </p>
                {errorAlerts.map((alert, index) => (
                  <div
                    key={`error-${index}`}
                    className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.type)}
                      <p className={`text-sm ${getTextColor(alert.type)} flex-1`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Warning Alerts */}
            {warningAlerts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">
                  Warnings ({warningAlerts.length})
                </p>
                {warningAlerts.map((alert, index) => (
                  <div
                    key={`warning-${index}`}
                    className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.type)}
                      <p className={`text-sm ${getTextColor(alert.type)} flex-1`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info Alerts */}
            {infoAlerts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Information ({infoAlerts.length})
                </p>
                {infoAlerts.map((alert, index) => (
                  <div
                    key={`info-${index}`}
                    className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getAlertIcon(alert.type)}
                      <p className={`text-sm ${getTextColor(alert.type)} flex-1`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
