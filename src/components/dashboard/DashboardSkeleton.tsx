'use client';

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Shift Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4">
            <Pulse className="h-4 w-24 mb-3" />
            <Pulse className="h-3 w-32 mb-2" />
            <Pulse className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card p-4">
            <Pulse className="h-8 w-8 mb-3 rounded-lg" />
            <Pulse className="h-3 w-16 mb-2" />
            <Pulse className="h-5 w-20" />
          </div>
        ))}
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <Pulse className="h-5 w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Pulse key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="card p-5">
          <Pulse className="h-5 w-36 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Pulse key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <Pulse className="h-5 w-32 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Pulse key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="card p-5">
          <Pulse className="h-5 w-28 mb-4" />
          <Pulse className="h-3 w-full mb-3" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <Pulse key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Recent reports table */}
      <div className="card p-5">
        <Pulse className="h-5 w-44 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Pulse key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
