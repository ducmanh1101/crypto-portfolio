'use client';

import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { useImportMutations } from '../lib/hooks/useImport';
import { ValidationErrorDto } from '../lib/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [activeTab, setActiveTab] = useState<'trades' | 'prices'>('trades');
  const [tradesFile, setTradesFile] = useState<File | null>(null);
  const [pricesFile, setPricesFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorDto[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const { importTradesMutation, importPricesMutation, resetDataMutation } = useImportMutations();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentFile = activeTab === 'trades' ? tradesFile : pricesFile;
  const setCurrentFile = activeTab === 'trades' ? setTradesFile : setPricesFile;

  const isUploading =
    importTradesMutation.isPending || importPricesMutation.isPending || resetDataMutation.isPending;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setCurrentFile(file);
        setValidationErrors([]);
        setStatusMessage(null);
      } else {
        setStatusMessage({ type: 'error', text: 'Please select a valid .csv file' });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCurrentFile(e.target.files[0]);
      setValidationErrors([]);
      setStatusMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFile) return;

    setValidationErrors([]);
    setStatusMessage(null);

    try {
      if (activeTab === 'trades') {
        const res = await importTradesMutation.mutateAsync(currentFile);
        setStatusMessage({
          type: 'success',
          text: `Atomic import successful! ${res.imported} trades reloaded into portfolio.`,
        });
        setTradesFile(null);
      } else {
        const res = await importPricesMutation.mutateAsync(currentFile);
        setStatusMessage({
          type: 'success',
          text: `Prices snapshot updated! ${res.imported} prices applied.`,
        });
        setPricesFile(null);
      }
    } catch (err: any) {
      const errorResponse = err?.errors ?? err?.errorData?.errors;
      if (Array.isArray(errorResponse)) {
        setValidationErrors(errorResponse);
        setStatusMessage({
          type: 'error',
          text: err?.message || 'Import failed validation. No partial state saved (atomic rejection).',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: err?.message || 'Unexpected import failure occurred.',
        });
      }
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset the database to initial sample files (data/trades.csv & data/prices.csv)?')) {
      return;
    }
    setValidationErrors([]);
    setStatusMessage(null);
    try {
      const res = await resetDataMutation.mutateAsync();
      setStatusMessage({
        type: 'success',
        text: `Portfolio reset successfully (${res.tradesImported} trades, ${res.pricesImported} prices).`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to reset sample data.',
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
      aria-describedby="import-dialog-desc"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 id="import-dialog-title" className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Import / Re-import Dataset
              </h2>
              <p id="import-dialog-desc" className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Atomic CSV import with pre-commit validation and short-position replay
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 flex gap-3 border-b border-slate-200 dark:border-slate-800/60 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setActiveTab('trades');
              setValidationErrors([]);
              setStatusMessage(null);
            }}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'trades'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Trades History (trades.csv)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('prices');
              setValidationErrors([]);
              setStatusMessage(null);
            }}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'prices'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Market Prices (prices.csv)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-start gap-3 border animate-fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">
                  {statusMessage.type === 'success' ? 'Operation Completed' : 'Validation Error'}
                </span>
                <span>{statusMessage.text}</span>
              </div>
            </div>
          )}

          {/* Validation Errors Table */}
          {validationErrors.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-rose-500/30 rounded-2xl p-4 animate-fade-in">
              <div className="flex items-center justify-between mb-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  {validationErrors.length} Validation Errors Encountered (Atomic Rollback Active)
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {validationErrors.map((err, idx) => (
                  <div key={idx} className="py-2 flex items-start gap-3">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 flex-shrink-0">
                      Row {err.row}
                    </span>
                    <div className="flex-1">
                      {err.field && (
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 text-[11px] mr-2">[{err.field}]</span>
                      )}
                      <span className="text-slate-700 dark:text-slate-300">{err.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : currentFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950/40'
              }`}
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              {currentFile ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{currentFile.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                    {(currentFile.size / 1024).toFixed(1)} KB • Ready to validate and import
                  </p>
                  <span className="mt-3 text-xs text-cyan-600 dark:text-cyan-400 hover:underline">Click or drop to replace</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    Drag and drop your {activeTab === 'trades' ? 'trades.csv' : 'prices.csv'} here
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">or click to browse local files</p>
                  <span className="mt-3 text-[11px] font-mono text-slate-400">Supported format: .CSV</span>
                </div>
              )}
            </div>

            {/* Spec info badge */}
            <div className="flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60">
              <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Zero Partial State:</strong> The entire CSV is validated in a single atomic pass
                (schema, duplicate IDs, timestamp validity, positive ranges, and short-position replay).
                If any row fails, zero records are altered in the database.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetData}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetDataMutation.isPending ? 'animate-spin' : ''}`} />
                <span>Reset to Sample Data</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!currentFile || isUploading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-md shadow-cyan-600/25 disabled:opacity-50 disabled:pointer-events-none transition-all"
                >
                  {isUploading ? 'Validating & Importing…' : 'Validate & Import'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
