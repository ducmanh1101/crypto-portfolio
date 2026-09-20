'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Layers,
  Inbox,
} from 'lucide-react';
import { HoldingDto } from '../lib/types';
import {
  formatUsd,
  formatSignedUsd,
  formatPct,
  formatCryptoQty,
  formatSignedPct,
} from '../lib/format';
import { TokenBadge } from './TokenBadge';

interface HoldingsTableProps {
  positions: HoldingDto[];
  onImportClick?: () => void;
}

type SortField =
  | 'symbol'
  | 'quantityHeld'
  | 'averageCost'
  | 'currentPrice'
  | 'currentCostBasis'
  | 'currentValue'
  | 'realizedPnl'
  | 'unrealizedPnl'
  | 'totalPnl'
  | 'allocationPct';

export function HoldingsTable({ positions, onImportClick }: HoldingsTableProps) {
  const [showClosed, setShowClosed] = useState(true);
  const [sortField, setSortField] = useState<SortField>('currentValue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredPositions = useMemo(() => {
    return positions.filter((p) => {
      const qty = parseFloat(p.quantityHeld) || 0;
      if (!showClosed && qty === 0) {
        return false;
      }
      return true;
    });
  }, [positions, showClosed]);

  const sortedPositions = useMemo(() => {
    return [...filteredPositions].sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortField === 'symbol') {
        valA = a.symbol;
        valB = b.symbol;
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      valA = parseFloat(a[sortField]) || 0;
      valB = parseFloat(b[sortField]) || 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredPositions, sortField, sortOrder]);

  const closedCount = positions.filter((p) => (parseFloat(p.quantityHeld) || 0) === 0).length;
  const activeCount = positions.length - closedCount;

  if (positions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-12 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mx-auto flex items-center justify-center mb-4">
          <Inbox className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Holdings Found</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
          Your portfolio currently has no open or closed positions. Import your trade history
          or load sample data to see comprehensive analytics.
        </p>
        {onImportClick && (
          <button
            type="button"
            onClick={onImportClick}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all shadow-md shadow-cyan-600/25"
          >
            Import trades.csv
          </button>
        )}
      </div>
    );
  }

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
    );
  };

  return (
    <section aria-label="Holdings Details" className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl transition-colors">
      {/* Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Holdings &amp; Asset Valuations</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{positions.length} Total Assets</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeCount} Open</span>
              {closedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-slate-400 dark:text-slate-500">{closedCount} Closed</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Closed Assets Filter Toggle */}
        {closedCount > 0 && (
          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700/60 transition-colors">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={(e) => setShowClosed(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-cyan-500 focus:ring-cyan-400 bg-white dark:bg-slate-900 w-3.5 h-3.5"
            />
            <span>Show closed positions ({closedCount})</span>
          </label>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse" role="table">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/80">
              <th scope="col" className="py-3.5 px-4 sticky left-0 bg-slate-50 dark:bg-slate-950/90 backdrop-blur z-10">
                <button
                  type="button"
                  onClick={() => handleSort('symbol')}
                  className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors group"
                >
                  <span>Asset</span>
                  {renderSortIndicator('symbol')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('quantityHeld')}
                  className="flex items-center gap-1.5 justify-end hover:text-slate-900 dark:hover:text-white transition-colors ml-auto group"
                >
                  <span>Qty Held</span>
                  {renderSortIndicator('quantityHeld')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('averageCost')}
                  className="flex items-center gap-1.5 justify-end hover:text-slate-900 dark:hover:text-white transition-colors ml-auto group"
                >
                  <span>Avg Cost</span>
                  {renderSortIndicator('averageCost')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('currentPrice')}
                  className="flex items-center gap-1.5 justify-end hover:text-slate-900 dark:hover:text-white transition-colors ml-auto group"
                >
                  <span>Current Price</span>
                  {renderSortIndicator('currentPrice')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('currentCostBasis')}
                  className="flex items-center gap-1.5 justify-end hover:text-slate-900 dark:hover:text-white transition-colors ml-auto group"
                >
                  <span>Cost Basis</span>
                  {renderSortIndicator('currentCostBasis')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('currentValue')}
                  className="flex items-center gap-1.5 justify-end hover:text-slate-900 dark:hover:text-white transition-colors ml-auto group"
                >
                  <span>Current Value</span>
                  {renderSortIndicator('currentValue')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('realizedPnl')}
                  className="flex items-center gap-1.5 justify-end hover:text-slate-900 dark:hover:text-white transition-colors ml-auto group"
                >
                  <span>Realized P&amp;L</span>
                  {renderSortIndicator('realizedPnl')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('unrealizedPnl')}
                  className="flex items-center gap-1.5 justify-end hover:text-slate-900 dark:hover:text-white transition-colors ml-auto group"
                >
                  <span>Unrealized P&amp;L</span>
                  {renderSortIndicator('unrealizedPnl')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('totalPnl')}
                  className="flex items-center gap-1.5 justify-end hover:text-slate-900 dark:hover:text-white transition-colors ml-auto group"
                >
                  <span>Total P&amp;L</span>
                  {renderSortIndicator('totalPnl')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-right min-w-[130px]">
                <button
                  type="button"
                  onClick={() => handleSort('allocationPct')}
                  className="flex items-center gap-1.5 justify-end hover:text-slate-900 dark:hover:text-white transition-colors ml-auto group"
                >
                  <span>Allocation</span>
                  {renderSortIndicator('allocationPct')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono text-xs sm:text-sm">
            {sortedPositions.map((pos) => {
              const qty = parseFloat(pos.quantityHeld) || 0;
              const isClosed = qty === 0;
              const hasPrice = pos.currentPrice !== null && pos.currentPrice !== undefined && pos.currentPrice !== '';
              const realized = parseFloat(pos.realizedPnl) || 0;
              const unrealized = parseFloat(pos.unrealizedPnl) || 0;
              const totalPnl = parseFloat(pos.totalPnl) || 0;
              const alloc = parseFloat(pos.allocationPct) || 0;
              const costBasis = parseFloat(pos.currentCostBasis) || 0;
              const unrealizedRoi = costBasis > 0 ? unrealized / costBasis : 0;

              return (
                <tr
                  key={pos.symbol}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                    isClosed ? 'opacity-60 bg-slate-50/50 dark:bg-slate-950/20' : ''
                  }`}
                >
                  {/* Asset */}
                  <td className="py-3.5 px-4 sticky left-0 bg-white/95 dark:bg-slate-900/90 backdrop-blur z-10 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <TokenBadge symbol={pos.symbol} size="sm" />
                      {isClosed && (
                        <span className="text-[10px] uppercase font-sans font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          Closed
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Quantity Held */}
                  <td className="py-3.5 px-4 text-right text-slate-800 dark:text-slate-200 whitespace-nowrap font-mono">
                    {formatCryptoQty(pos.quantityHeld)}
                  </td>

                  {/* Avg Cost */}
                  <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono">
                    {isClosed ? '—' : formatUsd(pos.averageCost)}
                  </td>

                  {/* Current Price */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                    {hasPrice ? (
                      <span className="text-slate-900 dark:text-white font-medium">{formatUsd(pos.currentPrice)}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-sans">
                        <AlertCircle className="w-3 h-3" />
                        Price N/A
                      </span>
                    )}
                  </td>

                  {/* Current Cost Basis */}
                  <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono">
                    {formatUsd(pos.currentCostBasis)}
                  </td>

                  {/* Current Value */}
                  <td className="py-3.5 px-4 text-right text-slate-900 dark:text-white font-bold whitespace-nowrap font-mono">
                    {formatUsd(pos.currentValue)}
                  </td>

                  {/* Realized P&L */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                    <div className="flex flex-col items-end">
                      <span className={realized >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                        {formatSignedUsd(pos.realizedPnl)}
                      </span>
                      {realized !== 0 && (
                        <span className="text-[10px] text-slate-400 font-sans">
                          {realized > 0 ? 'gain' : 'loss'}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Unrealized P&L */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                    {isClosed ? (
                      <span className="text-slate-400 dark:text-slate-600">—</span>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className={unrealized >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                          {formatSignedUsd(pos.unrealizedPnl)}
                        </span>
                        {costBasis > 0 && (
                          <span className="text-[10px] text-slate-500 font-sans">
                            {formatSignedPct(unrealizedRoi)}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Total P&L */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                    <div className="flex flex-col items-end">
                      <span className={`font-bold ${totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatSignedUsd(pos.totalPnl)}
                      </span>
                    </div>
                  </td>

                  {/* Allocation % */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatPct(pos.allocationPct)}</span>
                      <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, alloc * 100))}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
