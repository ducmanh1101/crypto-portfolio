'use client';

import React from 'react';
import {
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Scale,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { PortfolioSummaryDto } from '../lib/types';
import {
  formatUsd,
  formatSignedUsd,
  formatSignedPct,
  formatDateTime,
  formatRelativeTime,
} from '../lib/format';

interface SummaryCardsProps {
  summary: PortfolioSummaryDto;
  reconciliation?: {
    isReconciled: boolean;
    computedSum: number;
    summaryValue: number;
    diff: number;
  };
}

export function SummaryCards({ summary, reconciliation }: SummaryCardsProps) {
  const currentVal = parseFloat(summary.currentValue) || 0;
  const costBasis = parseFloat(summary.currentCostBasis) || 0;
  const realized = parseFloat(summary.realizedPnl) || 0;
  const unrealized = parseFloat(summary.unrealizedPnl) || 0;
  const totalPnl = parseFloat(summary.totalPnl) || 0;
  const feesPaid = parseFloat(summary.totalFeesPaid) || 0;

  const unrealizedRoiPct = costBasis > 0 ? unrealized / costBasis : 0;
  const totalRoiPct = costBasis > 0 ? totalPnl / costBasis : 0;

  return (
    <section aria-label="Portfolio Key Performance Indicators" className="mb-8 space-y-4">
      {/* Top Meta Bar: Snapshot As-Of & Reconciliation Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {summary.pricesAsOf && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>
              Prices snapshot: <strong className="text-slate-900 dark:text-white font-bold">{formatDateTime(summary.pricesAsOf)}</strong>
            </span>
            <span className="text-slate-400 dark:text-slate-500">({formatRelativeTime(summary.pricesAsOf)})</span>
          </div>
        )}

        {reconciliation && (
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-sans text-xs shadow-sm ${
              reconciliation.isReconciled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}
          >
            {reconciliation.isReconciled ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Reconciled with Holdings Table ({formatUsd(reconciliation.summaryValue)})</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Discrepancy: Holdings sum differs by {formatUsd(reconciliation.diff)}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Avant-Garde Asymmetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* HERO COMMAND STAGE: Current Portfolio Value & Total P&L Hero (Spans 7 cols) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-lg shadow-slate-200/50 dark:shadow-cyan-950/20 relative overflow-hidden flex flex-col justify-between transition-all">
          {/* Subtle Cyber Grid Accent */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-radial-gradient pointer-events-none opacity-40 dark:opacity-20" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  <Wallet className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Portfolio Value
                </span>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-500/30">
                LIVE ASSET VALUATION
              </span>
            </div>

            {/* Giant Headline Net Worth */}
            <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono my-2">
              {formatUsd(summary.currentValue)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Aggregate valuation across all active crypto assets computed from trade history
            </p>
          </div>

          {/* Quick Sub-Stats Strip inside Hero */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-4 border-t border-slate-200/80 dark:border-slate-800/80 text-xs">
            {/* Realized */}
            <div className="bg-white/80 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                Realized Closed P&amp;L
              </span>
              <span
                className={`font-mono font-bold text-sm ${
                  realized >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatSignedUsd(summary.realizedPnl)}
              </span>
            </div>

            {/* Unrealized */}
            <div className="bg-white/80 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                Unrealized Open P&amp;L
              </span>
              <span
                className={`font-mono font-bold text-sm ${
                  unrealized >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatSignedUsd(summary.unrealizedPnl)}
              </span>
            </div>

            {/* ROI */}
            <div className="bg-white/80 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                Total Net Return
              </span>
              <span
                className={`font-mono font-bold text-sm ${
                  totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatSignedPct(totalRoiPct)}
              </span>
            </div>
          </div>
        </div>

        {/* SECONDARY PILLARS CLUSTER (Spans 5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card: Current Cost Basis */}
          <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Cost Basis
              </span>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {formatUsd(summary.currentCostBasis)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Weighted capital invested
              </p>
            </div>
          </div>

          {/* Card: Total P&L */}
          <div
            className={`bg-white dark:bg-slate-900/70 border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
              totalPnl >= 0
                ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                : 'border-rose-500/30 bg-rose-500/[0.02]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total P&amp;L
              </span>
              <div
                className={`p-2 rounded-xl ${
                  totalPnl >= 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatSignedUsd(summary.totalPnl)}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                    totalPnl >= 0
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {totalPnl >= 0 ? 'Net Gain' : 'Net Loss'}
                </span>
                {costBasis > 0 && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatSignedPct(totalRoiPct)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card: Realized P&L */}
          <div
            className={`bg-white dark:bg-slate-900/70 border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
              realized >= 0
                ? 'border-emerald-500/20'
                : 'border-rose-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Realized P&amp;L
              </span>
              <div
                className={`p-2 rounded-xl ${
                  realized >= 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {realized >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </div>
            </div>
            <div>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  realized >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatSignedUsd(summary.realizedPnl)}
              </div>
              <span
                className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono mt-1 ${
                  realized >= 0
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                }`}
              >
                {realized >= 0 ? 'Profit (Closed)' : 'Loss (Closed)'}
              </span>
            </div>
          </div>

          {/* Card: Unrealized P&L */}
          <div
            className={`bg-white dark:bg-slate-900/70 border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
              unrealized >= 0
                ? 'border-emerald-500/20'
                : 'border-rose-500/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Unrealized P&amp;L
              </span>
              <div
                className={`p-2 rounded-xl ${
                  unrealized >= 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}
              >
                {unrealized >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
            </div>
            <div>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  unrealized >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatSignedUsd(summary.unrealizedPnl)}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono ${
                    unrealized >= 0
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {unrealized >= 0 ? 'Open Gain' : 'Open Loss'}
                </span>
                {costBasis > 0 && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatSignedPct(unrealizedRoiPct)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card: Total Fees Paid (Standout Banner Pillar) */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-5 py-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Fees
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cumulative broker &amp; exchange fees across all historical BUY &amp; SELL executions
            </p>
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
          {formatUsd(summary.totalFeesPaid)}
        </div>
      </div>
    </section>
  );
}
