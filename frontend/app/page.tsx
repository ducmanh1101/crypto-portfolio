'use client';

import React, { useState } from 'react';
import { usePortfolio } from '../lib/hooks/usePortfolio';
import { SummaryCards } from '../components/SummaryCards';
import { HoldingsTable } from '../components/HoldingsTable';
import { Charts } from '../components/Charts';
import { ImportPanel } from '../components/ImportPanel';
import { ImportModal } from '../components/ImportModal';
import { ErrorBanner } from '../components/ErrorBanner';
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '../components/Skeleton';

export default function DashboardPage() {
  const { snapshot, summary, positions, isLoading, isError, error, refetch, reconciliation } =
    usePortfolio();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <main className="space-y-8 animate-fade-in" aria-label="Portfolio Dashboard">
      {/* Page Title & Subtitle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Portfolio Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time portfolio valuation, weighted-average cost basis, and P&amp;L performance
          </p>
        </div>
      </div>

      {/* Quick Import Panel */}
      <ImportPanel />

      {/* Global Error Banner */}
      {isError && (
        <ErrorBanner
          title="Failed to Load Portfolio Snapshot"
          message={error?.message || 'Unable to connect to the backend analytics service.'}
          onRetry={() => refetch()}
        />
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <TableSkeleton rows={6} cols={10} />
        </div>
      )}

      {/* Main Data Content */}
      {!isLoading && !isError && summary && (
        <>
          {/* 1. Headline KPI Cards */}
          <SummaryCards summary={summary} reconciliation={reconciliation} />

          {/* 2. Visual Charts (Allocation & P&L) */}
          <Charts positions={positions} />

          {/* 3. Holdings & Valuation Table */}
          <HoldingsTable
            positions={positions}
            onImportClick={() => setIsImportModalOpen(true)}
          />
        </>
      )}

      {/* Import Modal */}
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </main>
  );
}
