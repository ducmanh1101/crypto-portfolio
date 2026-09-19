'use client';

import { useEffect, useState } from 'react';
import { fetchTrades } from '../lib/api';
import { TradeRow } from '../lib/types';
import { formatUsd } from '../lib/format';

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'CKB', 'DOGE'];
const EXCHANGES = ['Binance', 'Coinbase'];
const SIDES = ['BUY', 'SELL'];

export function TransactionTable() {
  const [rows, setRows] = useState<TradeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ symbol: '', exchange: '', side: '', from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), pageSize: '20' };
    for (const [k, v] of Object.entries(filters)) if (v) params[k] = v;

    fetchTrades(params)
      .then((res) => {
        setRows(res.items);
        setTotal(res.total);
        setError(null);
      })
      .catch((e) => setError(e.message ?? 'Failed to load transactions'))
      .finally(() => setLoading(false));
  }, [page, filters]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="transaction-explorer">
      <div className="filters">
        <select value={filters.symbol} onChange={(e) => setFilters({ ...filters, symbol: e.target.value })}>
          <option value="">All assets</option>
          {SYMBOLS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filters.exchange} onChange={(e) => setFilters({ ...filters, exchange: e.target.value })}>
          <option value="">All exchanges</option>
          {EXCHANGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filters.side} onChange={(e) => setFilters({ ...filters, side: e.target.value })}>
          <option value="">Buy & Sell</option>
          {SIDES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
      </div>

      {loading && <div className="loading-state">Loading transactions…</div>}
      {error && <div className="error-state">Couldn&apos;t load transactions: {error}</div>}

      {!loading && !error && (
        <>
          <table className="tx-table">
            <thead>
              <tr>
                <th>Trade ID</th><th>Timestamp</th><th>Exchange</th><th>Symbol</th>
                <th>Side</th><th>Qty</th><th>Price</th><th>Fee</th><th>Gross Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.tradeId}>
                  <td>{r.tradeId}</td>
                  <td>{new Date(r.timestamp).toLocaleString()}</td>
                  <td>{r.exchange}</td>
                  <td>{r.symbol}</td>
                  <td>{r.side}</td>
                  <td>{r.quantity}</td>
                  <td>{formatUsd(r.priceUsd)}</td>
                  <td>{formatUsd(r.feeUsd)}</td>
                  <td>{formatUsd(r.grossValueUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
