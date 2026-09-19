'use client';

import { useState } from 'react';
import { importTradesCsv, importPricesCsv } from '../lib/api';
import { ImportError } from '../lib/types';

/**
 * Import/re-import control for trades.csv + prices.csv. Surfaces
 * per-row validation errors returned by the backend (see
 * backend/src/import/csv-validator.ts) rather than a generic failure message.
 */
export function ImportPanel() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function handleTradesUpload(file: File) {
    setStatus('loading');
    setErrors([]);
    try {
      const res = await importTradesCsv(file);
      setStatus('success');
      setMessage(`Imported ${res.imported} trades.`);
      // Reload dashboard data — in a full implementation, use router.refresh()
      // (this is a server component parent) or a client-side data hook.
      window.location.reload();
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message ?? 'Import failed');
      setErrors(err?.errors ?? []);
    }
  }

  async function handlePricesUpload(file: File) {
    setStatus('loading');
    try {
      await importPricesCsv(file);
      setStatus('success');
      window.location.reload();
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message ?? 'Import failed');
    }
  }

  return (
    <div className="import-panel">
      <label>
        Import trades.csv
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handleTradesUpload(e.target.files[0])}
        />
      </label>
      <label>
        Import prices.csv
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && handlePricesUpload(e.target.files[0])}
        />
      </label>

      {status === 'loading' && <div className="loading-state">Importing…</div>}
      {message && <div className={status === 'error' ? 'error-state' : 'success-state'}>{message}</div>}
      {errors.length > 0 && (
        <ul className="import-errors">
          {errors.slice(0, 20).map((e, i) => (
            <li key={i}>
              Row {e.row}{e.field ? ` (${e.field})` : ''}: {e.message}
            </li>
          ))}
          {errors.length > 20 && <li>…and {errors.length - 20} more errors</li>}
        </ul>
      )}
    </div>
  );
}
