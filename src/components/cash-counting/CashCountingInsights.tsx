'use client';

import { Lightbulb } from 'lucide-react';
import { generateInsights } from '@/lib/cash-counting-utils';
import type { CashCountingEntry } from '@/lib/cash-counting-utils';

interface CashCountingInsightsProps {
  entries: CashCountingEntry[];
}

export default function CashCountingInsights({ entries }: CashCountingInsightsProps) {
  const insights = generateInsights(entries);

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Business Insights
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">Auto-generated insights from your data</p>
      </div>

      <div className="p-6">
        {insights.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No insights available. Add more entries to generate insights.
          </p>
        ) : (
          <ul className="space-y-3">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
