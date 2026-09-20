'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  UploadCloud,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { resetSampleData } from '../lib/api';
import { PORTFOLIO_QUERY_KEY } from '../lib/hooks/usePortfolio';
import { TRADES_QUERY_KEY } from '../lib/hooks/useTrades';
import { usePrices, PRICES_QUERY_KEY } from '../lib/hooks/usePrices';
import { ImportModal } from './ImportModal';
import { ThemeToggle } from './ThemeToggle';
import { formatUsd } from '../lib/format';
import { TokenBadge } from './TokenBadge';

export function TopNav() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Reactively subscribe to current price snapshot via TanStack Query
  const { data: pricesData } = usePrices();
  const tickerPrices = pricesData?.prices ?? [];

  const handleResetData = async () => {
    if (!window.confirm('Reset portfolio to sample files (data/trades.csv & data/prices.csv)?')) {
      return;
    }
    try {
      setIsResetting(true);
      const res = await resetSampleData();
      await queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: [TRADES_QUERY_KEY] });
      await queryClient.invalidateQueries({ queryKey: PRICES_QUERY_KEY });
      setResetMessage(`Reset complete (${res.tradesImported} trades, ${res.pricesImported} prices).`);
      setTimeout(() => setResetMessage(null), 4000);
    } catch (err: any) {
      alert(`Reset failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsResetting(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  KRYPTON
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold tracking-wider">
                    Terminal
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wide">
                  Portfolio Analytics v2.0
                </span>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-900 dark:text-white shadow-sm border border-slate-300 dark:border-slate-700/60 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Actions & Theme Controls */}
          <div className="flex items-center gap-2.5">
            {/* Reset status notification */}
            {resetMessage && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{resetMessage}</span>
              </div>
            )}

            {/* Theme Selector (Light, Dark, System) */}
            <ThemeToggle />

            {/* Reset dataset button */}
            <button
              type="button"
              onClick={handleResetData}
              disabled={isResetting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              title="Reset portfolio database to sample files (data/trades.csv)"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-cyan-500' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{isResetting ? 'Resetting…' : 'Reset'}</span>
            </button>

            {/* Import CSV Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-md shadow-cyan-600/20 border border-cyan-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
          </div>
        </div>

        {/* Live Market Ticker Tape */}
        {tickerPrices.length > 0 && (
          <div className="border-t border-slate-200/60 dark:border-white/[0.04] bg-slate-100/60 dark:bg-slate-950/40 py-1.5 px-4 overflow-x-auto text-[11px] font-mono select-none">
            <div className="max-w-7xl mx-auto flex items-center gap-6 whitespace-nowrap">
              <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
                <TrendingUp className="w-3 h-3" />
                Snapshot Feed
              </span>
              <div className="flex items-center gap-6 text-slate-600 dark:text-slate-300">
                {tickerPrices.map((t) => (
                  <div key={t.symbol} className="inline-flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white">{t.symbol}</span>
                    <span className="text-slate-500 dark:text-slate-400">{formatUsd(t.priceUsd)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-200 dark:border-slate-800/80 px-4 py-2 bg-white dark:bg-slate-950/90 gap-2 justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center gap-2 flex-1 py-1.5 rounded-lg text-xs font-medium ${
                  isActive ? 'bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 font-semibold' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Import & Data Management Modal */}
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </>
  );
}
