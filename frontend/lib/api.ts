import { PortfolioSnapshot, TradesResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function fetchPortfolioSnapshot(): Promise<PortfolioSnapshot> {
  const res = await fetch(`${API_BASE}/api/portfolio`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load portfolio (${res.status})`);
  return res.json();
}

export async function fetchTrades(params: Record<string, string>): Promise<TradesResponse> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/trades?${qs}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load trades (${res.status})`);
  return res.json();
}

export async function importTradesCsv(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/import/trades`, { method: 'POST', body: form });
  const body = await res.json();
  if (!res.ok) {
    // Body carries { message, errors: ImportError[] } — surface it to the UI as-is.
    throw body;
  }
  return body;
}

export async function importPricesCsv(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/import/prices`, { method: 'POST', body: form });
  if (!res.ok) throw await res.json();
  return res.json();
}
