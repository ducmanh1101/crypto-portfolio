'use client';

import React, { useState } from 'react';
import { UploadCloud, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useImportMutations } from '../lib/hooks/useImport';
import { ValidationErrorDto } from '../lib/types';
import { ImportModal } from './ImportModal';

export function ImportPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);
  const [inlineErrors, setInlineErrors] = useState<ValidationErrorDto[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { importTradesMutation, importPricesMutation, resetDataMutation } = useImportMutations();

  const handleTradesUpload = async (file: File) => {
    setStatus('loading');
    setInlineErrors([]);
    setInlineMessage(null);
    try {
      const res = await importTradesMutation.mutateAsync(file);
      setStatus('success');
      setInlineMessage(`Successfully imported ${res.imported} trades.`);
    } catch (err: any) {
      setStatus('error');
      setInlineMessage(err?.message || 'Import failed validation');
      setInlineErrors(err?.errors || []);
    }
  };

  const handlePricesUpload = async (file: File) => {
    setStatus('loading');
    setInlineErrors([]);
    setInlineMessage(null);
    try {
      const res = await importPricesMutation.mutateAsync(file);
      setStatus('success');
      setInlineMessage(`Successfully imported ${res.imported} prices.`);
    } catch (err: any) {
      setStatus('error');
      setInlineMessage(err?.message || 'Import failed');
      setInlineErrors(err?.errors || []);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 mb-6 shadow-sm dark:shadow-md transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Data Management &amp; Import</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload trades.csv or prices.csv with atomic pre-validation
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick file inputs */}
          <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors">
            <span>Import trades.csv</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleTradesUpload(e.target.files[0])}
            />
          </label>

          <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors">
            <span>Import prices.csv</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handlePricesUpload(e.target.files[0])}
            />
          </label>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-sm"
          >
            <span>Open Advanced Importer</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {status === 'loading' && (
        <div className="mt-3 text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-2 font-mono">
          <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span>Validating &amp; importing dataset atomically…</span>
        </div>
      )}

      {/* Message feedback */}
      {inlineMessage && (
        <div
          className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
            status === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}
        >
          {status === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          )}
          <span>{inlineMessage}</span>
        </div>
      )}

      {/* Validation errors list */}
      {inlineErrors.length > 0 && (
        <div className="mt-3 bg-slate-50 dark:bg-slate-950/80 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-800 dark:text-rose-300 max-h-40 overflow-y-auto">
          <strong className="block mb-1 text-rose-700 dark:text-rose-200">
            {inlineErrors.length} Validation Errors (No partial data saved):
          </strong>
          <ul className="space-y-1">
            {inlineErrors.map((err, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">Row {err.row}:</span>
                <span>
                  {err.field ? `[${err.field}] ` : ''}
                  {err.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ImportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
