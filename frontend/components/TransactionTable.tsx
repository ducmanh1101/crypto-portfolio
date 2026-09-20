'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useTrades } from '../lib/hooks/useTrades';
import { formatUsd, formatCryptoQty, formatDateTime } from '../lib/format';
import { TokenBadge } from './TokenBadge';
import { TableSkeleton } from './Skeleton';
import { ErrorBanner } from './ErrorBanner';

const ASSETS = ['BTC', 'ETH', 'SOL', 'CKB', 'DOGE'];
const EXCHANGES = ['Binance', 'Coinbase'];
const SIDES = ['BUY', 'SELL'];

export function TransactionTable() {
  const [isMounted, setIsMounted] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [exchange, setExchange] = useState('');
  const [side, setSide] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const queryParams = {
    symbol: symbol || undefined,
    exchange: exchange || undefined,
    side: side || undefined,
    from: from || undefined,
    to: to || undefined,
    sort,
    page,
    pageSize,
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useTrades(queryParams);

  const trades = Array.isArray(data?.items) ? data.items : [];
  const total = typeof data?.total === 'number' ? data.total : trades.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Client-side quick search by trade ID or symbol if entered (strictly null-safe)
  const queryLower = searchQuery.toLowerCase().trim();
  const displayedTrades = queryLower
    ? trades.filter((t) =>
        Boolean(
          (t?.tradeId?.toLowerCase() ?? '').includes(queryLower) ||
          (t?.symbol?.toLowerCase() ?? '').includes(queryLower)
        )
      )
    : trades;

  const hasActiveFilters = Boolean(symbol || exchange || side || from || to || searchQuery);

  const clearFilters = () => {
    setSymbol('');
    setExchange('');
    setSide('');
    setFrom('');
    setTo('');
    setSearchQuery('');
    setPage(1);
  };

  const exportFilteredCsv = () => {
    if (trades.length === 0) return;
    const headers = [
      'trade_id',
      'timestamp',
      'exchange',
      'symbol',
      'side',
      'quantity',
      'price_usd',
      'fee_usd',
      'gross_value_usd',
    ];
    const rows = trades.map((t) => [
      t.tradeId,
      t.timestamp,
      t.exchange,
      t.symbol,
      t.side,
      t.quantity,
      t.priceUsd,
      t.feeUsd,
      t.grossValueUsd,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('link');
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `trades-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl transition-colors">
      {/* Filters Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Filter className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Transaction Explorer</h2>
            {isFetching && (
              <span className="text-xs text-cyan-600 dark:text-cyan-400 animate-pulse font-mono ml-2">Updating…</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            )}

            <button
              type="button"
              onClick={exportFilteredCsv}
              disabled={trades.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 disabled:opacity-50 transition-colors shadow-sm"
              title="Download filtered transactions as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Search by ID */}
          <div className="relative">
            <label htmlFor="filter-search" className="sr-only">Search Trade ID</label>
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="filter-search"
              type="text"
              placeholder="Search Trade ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          {/* Asset Dropdown */}
          <div>
            <label htmlFor="filter-asset" className="sr-only">Filter by Asset</label>
            <select
              id="filter-asset"
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            >
              <option value="">All Assets</option>
              {ASSETS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Exchange Dropdown */}
          <div>
            <label htmlFor="filter-exchange" className="sr-only">Filter by Exchange</label>
            <select
              id="filter-exchange"
              value={exchange}
              onChange={(e) => {
                setExchange(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            >
              <option value="">All Exchanges</option>
              {EXCHANGES.map((ex) => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>

          {/* Side Dropdown */}
          <div>
            <label htmlFor="filter-side" className="sr-only">Filter by Side</label>
            <select
              id="filter-side"
              value={side}
              onChange={(e) => {
                setSide(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            >
              <option value="">All Sides (BUY / SELL)</option>
              {SIDES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Date Range: From */}
          <div className="relative">
            <label htmlFor="filter-from" className="sr-only">Date From</label>
            <input
              id="filter-from"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              title="From date"
            />
          </div>

          {/* Date Range: To */}
          <div className="relative">
            <label htmlFor="filter-to" className="sr-only">Date To</label>
            <input
              id="filter-to"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              title="To date"
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="p-4">
          <ErrorBanner
            message={error?.message || 'Failed to load transaction data'}
            onRetry={() => refetch()}
          />
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-4">
          <TableSkeleton rows={8} cols={9} />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && displayedTrades.length === 0 && (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No transactions match your criteria</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-sm mx-auto">
            Try adjusting or clearing your filters to see more results.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Transactions Data Table */}
      {!isLoading && !isError && displayedTrades.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse" role="table">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/80">
                  <th scope="col" className="py-3 px-4 sticky left-0 bg-slate-50 dark:bg-slate-950/90 backdrop-blur z-10">Trade ID</th>
                  <th scope="col" className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
                      className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="Sort by Timestamp"
                    >
                      <span>Timestamp</span>
                      {sort === 'desc' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      ) : (
                        <ArrowUp className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="py-3 px-4">Exchange</th>
                  <th scope="col" className="py-3 px-4">Symbol</th>
                  <th scope="col" className="py-3 px-4">Side</th>
                  <th scope="col" className="py-3 px-4 text-right">Quantity</th>
                  <th scope="col" className="py-3 px-4 text-right">Execution Price</th>
                  <th scope="col" className="py-3 px-4 text-right">Fee</th>
                  <th scope="col" className="py-3 px-4 text-right">Gross Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono text-xs sm:text-sm">
                {displayedTrades.map((t, idx) => (
                  <tr
                    key={t?.tradeId || `tx-${t?.symbol || 'coin'}-${idx}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Trade ID */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap sticky left-0 bg-white/95 dark:bg-slate-900/90 backdrop-blur z-10">
                      {t?.tradeId ?? 'N/A'}
                    </td>

                    {/* Timestamp */}
                    <td
                      suppressHydrationWarning
                      className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-sans text-xs"
                    >
                      {isMounted ? formatDateTime(t?.timestamp) : (t?.timestamp ?? '—')}
                    </td>

                    {/* Exchange */}
                    <td className="py-3 px-4 whitespace-nowrap font-sans text-xs">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium border ${
                          (t?.exchange ?? '').toLowerCase() === 'binance'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                        }`}
                      >
                        {t?.exchange ?? 'Unknown'}
                      </span>
                    </td>

                    {/* Symbol */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <TokenBadge symbol={t?.symbol ?? ''} size="sm" />
                    </td>

                    {/* Side */}
                    <td className="py-3 px-4 whitespace-nowrap font-sans text-xs">
                      <span
                        className={`inline-flex items-center font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          t?.side === 'BUY'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {t?.side ?? 'BUY'}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-4 text-right text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {formatCryptoQty(t?.quantity)}
                    </td>

                    {/* Price USD */}
                    <td className="py-3 px-4 text-right text-slate-900 dark:text-white font-medium whitespace-nowrap">
                      {formatUsd(t?.priceUsd)}
                    </td>

                    {/* Fee USD */}
                    <td className="py-3 px-4 text-right text-amber-700 dark:text-amber-300/90 whitespace-nowrap">
                      {formatUsd(t?.feeUsd)}
                    </td>

                    {/* Gross Value */}
                    <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatUsd(t?.grossValueUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
              <span>
                Showing{' '}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {total === 0 ? 0 : (page - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {Math.min(page * pageSize, total)}
                </strong>{' '}
                of <strong className="text-slate-900 dark:text-white font-mono">{total}</strong> transactions
              </span>

              {/* Page size selector */}
              <div className="flex items-center gap-1.5 ml-2">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Page navigation buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                aria-label="First page"
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-300 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-mono text-slate-600 dark:text-slate-300">
                Page <strong className="text-slate-900 dark:text-white">{page}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                aria-label="Last page"
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-700 dark:text-slate-300 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
