import React from 'react';

export function CardSkeleton() {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3.5 bg-slate-800 rounded w-24" />
        <div className="h-7 w-7 bg-slate-800 rounded-lg" />
      </div>
      <div className="h-8 bg-slate-800 rounded w-36 mb-2" />
      <div className="h-3 bg-slate-800 rounded w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 overflow-hidden animate-pulse">
      <div className="flex gap-4 pb-4 border-b border-slate-800/80">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-800 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-800/50">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 py-4 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="h-4 bg-slate-800/60 rounded flex-1"
                style={{ width: `${60 + ((c * 17) % 35)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 animate-pulse">
      <div className="h-5 bg-slate-800 rounded w-48 mb-6" />
      <div className="h-64 flex items-center justify-center">
        <div className="w-44 h-44 rounded-full border-8 border-slate-800 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-slate-800/40" />
        </div>
      </div>
    </div>
  );
}

