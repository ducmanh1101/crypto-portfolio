'use client';

import React, { useState } from 'react';
import { PieChart, BarChart3, TrendingUp } from 'lucide-react';
import { HoldingDto } from '../lib/types';
import { formatUsd, formatSignedUsd, formatPct } from '../lib/format';
import { TokenBadge } from './TokenBadge';

interface ChartsProps {
  positions: HoldingDto[];
}

const TOKEN_COLORS: Record<string, string> = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#14F195',
  CKB: '#00CC9B',
  DOGE: '#C2A633',
};

const DEFAULT_COLORS = ['#06B6D4', '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

function getTokenColor(symbol: string, index: number): string {
  return TOKEN_COLORS[symbol.toUpperCase()] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

/**
 * Chart 1: Portfolio Allocation by Current Value
 * Interactive SVG Donut Chart with center summary, hover slices, and coordinated legend.
 */
export function AllocationChart({ positions }: { positions: HoldingDto[] }) {
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  const held = positions.filter((p) => (parseFloat(p.currentValue) || 0) > 0);
  const totalValue = held.reduce((sum, p) => sum + (parseFloat(p.currentValue) || 0), 0);

  if (totalValue === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[340px] text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
          <PieChart className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No Allocation Data</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-xs">
          Open positions are needed to render the allocation breakdown.
        </p>
      </div>
    );
  }

  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  const slices = held.map((pos, idx) => {
    const val = parseFloat(pos.currentValue) || 0;
    const fraction = val / totalValue;
    const dash = fraction * circumference;
    const offset = -cumulative;
    cumulative += dash;
    const color = getTokenColor(pos.symbol, idx);

    return {
      symbol: pos.symbol,
      value: val,
      fraction,
      dash,
      offset,
      color,
    };
  });

  const activeSlice = hoveredSymbol ? slices.find((s) => s.symbol === hoveredSymbol) : null;

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <PieChart className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Allocation by Current Value</h3>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Total: <strong className="text-slate-900 dark:text-white font-bold">{formatUsd(totalValue)}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-6 my-auto">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-48 h-48 sm:w-52 sm:h-52 transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="24"
            />
            {slices.map((slice) => {
              const isHovered = hoveredSymbol === slice.symbol;
              return (
                <circle
                  key={slice.symbol}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? 28 : 22}
                  strokeDasharray={`${slice.dash} ${circumference - slice.dash}`}
                  strokeDashoffset={slice.offset}
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 8px ${slice.color})` : undefined,
                  }}
                  onMouseEnter={() => setHoveredSymbol(slice.symbol)}
                  onMouseLeave={() => setHoveredSymbol(null)}
                />
              );
            })}
          </svg>

          {/* Center Info in Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
            {activeSlice ? (
              <>
                <span className="text-xs font-mono uppercase font-bold" style={{ color: activeSlice.color }}>
                  {activeSlice.symbol}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatUsd(activeSlice.value)}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {formatPct(activeSlice.fraction)}
                </span>
              </>
            ) : (
              <>
                <span className="text-[11px] text-slate-400 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  Portfolio
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatUsd(totalValue)}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">100% Allocated</span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {slices.map((slice) => {
            const isHovered = hoveredSymbol === slice.symbol;
            return (
              <div
                key={slice.symbol}
                onMouseEnter={() => setHoveredSymbol(slice.symbol)}
                onMouseLeave={() => setHoveredSymbol(null)}
                className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: slice.color,
                      boxShadow: isHovered ? `0 0 8px ${slice.color}` : undefined,
                    }}
                  />
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{slice.symbol}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-500 dark:text-slate-400">{formatUsd(slice.value)}</span>
                  <span className="font-bold text-slate-900 dark:text-white min-w-[42px] text-right">
                    {formatPct(slice.fraction)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Chart 2: Realized vs Unrealized P&L by Asset
 * Visual bar comparison per asset clearly handling both positive and negative P&L values.
 */
export function PnlByAssetChart({ positions }: { positions: HoldingDto[] }) {
  if (positions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[340px] text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No P&amp;L Data</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-xs">
          Positions are needed to chart realized vs unrealized profit and loss.
        </p>
      </div>
    );
  }

  const maxAbsPnl = Math.max(
    10,
    ...positions.flatMap((p) => [
      Math.abs(parseFloat(p.realizedPnl) || 0),
      Math.abs(parseFloat(p.unrealizedPnl) || 0),
    ])
  );

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
            Realized vs Unrealized P&amp;L by Asset
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <span>Realized</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span>Unrealized</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 my-auto">
        {positions.map((p) => {
          const realized = parseFloat(p.realizedPnl) || 0;
          const unrealized = parseFloat(p.unrealizedPnl) || 0;
          const realizedWidth = Math.min(100, (Math.abs(realized) / maxAbsPnl) * 100);
          const unrealizedWidth = Math.min(100, (Math.abs(unrealized) / maxAbsPnl) * 100);

          return (
            <div key={p.symbol} className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/60">
              <div className="flex items-center justify-between text-xs mb-2">
                <TokenBadge symbol={p.symbol} size="sm" />
                <div className="flex items-center gap-3 font-mono">
                  <span
                    className={
                      realized >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'
                    }
                    title="Realized P&L"
                  >
                    R: {formatSignedUsd(realized)}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span
                    className={
                      unrealized >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'
                    }
                    title="Unrealized P&L"
                  >
                    U: {formatSignedUsd(unrealized)}
                  </span>
                </div>
              </div>

              {/* Realized Bar */}
              <div className="mb-1.5">
                <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">
                  <span className="w-16">Realized:</span>
                  <div className="flex-1 h-3.5 bg-slate-200 dark:bg-slate-900 rounded-md overflow-hidden relative border border-slate-300 dark:border-slate-800">
                    <div
                      className={`h-full rounded-sm transition-all duration-500 ${
                        realized >= 0
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                          : 'bg-gradient-to-r from-rose-600 to-rose-400'
                      }`}
                      style={{ width: `${Math.max(2, realizedWidth)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {formatSignedUsd(realized)}
                  </span>
                </div>
              </div>

              {/* Unrealized Bar */}
              <div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="w-16">Unrealized:</span>
                  <div className="flex-1 h-3.5 bg-slate-200 dark:bg-slate-900 rounded-md overflow-hidden relative border border-slate-300 dark:border-slate-800">
                    <div
                      className={`h-full rounded-sm transition-all duration-500 ${
                        unrealized >= 0
                          ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                          : 'bg-gradient-to-r from-amber-600 to-rose-500'
                      }`}
                      style={{ width: `${Math.max(2, unrealizedWidth)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {formatSignedUsd(unrealized)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Charts({ positions }: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <AllocationChart positions={positions} />
      <PnlByAssetChart positions={positions} />
    </div>
  );
}
