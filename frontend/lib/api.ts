import {
  HoldingDto,
  ImportErrorResponseDto,
  ImportResultDto,
  PaginatedTransactionsDto,
  PortfolioSnapshotDto,
  PortfolioSummaryDto,
  PricesResponseDto,
  ResetResultDto,
  TradesQueryDto,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  errors?: ImportErrorResponseDto['errors'];

  constructor(message: string, status: number, errors?: ImportErrorResponseDto['errors']) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorData: any = null;
    try {
      errorData = await res.json();
    } catch {
      // Body not JSON
    }
    const message = errorData?.message || `Request failed with status ${res.status}`;
    const errors = errorData?.errors;
    throw new ApiError(message, res.status, errors);
  }
  return res.json();
}

export async function fetchPortfolioSnapshot(): Promise<PortfolioSnapshotDto> {
  try {
    const res = await fetch(`${API_BASE}/api/portfolio`, { cache: 'no-store' });
    return await handleResponse<PortfolioSnapshotDto>(res);
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      'Unable to connect to backend API. Please ensure backend is running at ' + API_BASE,
      0
    );
  }
}

export async function fetchPortfolioSummary(): Promise<PortfolioSummaryDto> {
  const res = await fetch(`${API_BASE}/api/portfolio/summary`, { cache: 'no-store' });
  return handleResponse<PortfolioSummaryDto>(res);
}

export async function fetchHoldings(): Promise<HoldingDto[]> {
  const res = await fetch(`${API_BASE}/api/portfolio/holdings`, { cache: 'no-store' });
  return handleResponse<HoldingDto[]>(res);
}

export async function fetchPrices(): Promise<PricesResponseDto> {
  const res = await fetch(`${API_BASE}/api/prices`, { cache: 'no-store' });
  return handleResponse<PricesResponseDto>(res);
}

export async function fetchTrades(params: TradesQueryDto = {}): Promise<PaginatedTransactionsDto> {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const qs = searchParams.toString();
  const url = `${API_BASE}/api/trades${qs ? `?${qs}` : ''}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    return await handleResponse<PaginatedTransactionsDto>(res);
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Failed to fetch transactions: ' + (err.message || 'Network error'), 0);
  }
}

export async function importTradesCsv(file: File): Promise<ImportResultDto> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/api/import/trades`, {
    method: 'POST',
    body: form,
  });

  return handleResponse<ImportResultDto>(res);
}

export async function importPricesCsv(file: File): Promise<ImportResultDto> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/api/import/prices`, {
    method: 'POST',
    body: form,
  });

  return handleResponse<ImportResultDto>(res);
}

export async function resetSampleData(): Promise<ResetResultDto> {
  const res = await fetch(`${API_BASE}/api/portfolio/reset`, {
    method: 'POST',
  });

  return handleResponse<ResetResultDto>(res);
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/portfolio/summary`, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
