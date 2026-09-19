// Mirrors backend/src/calculation/types.ts but with plain strings/numbers,
// since Decimal values cross the HTTP boundary as JSON strings and are
// only re-parsed to Decimal if/when the frontend needs to do further math
// (mostly it just formats them for display).

export interface AssetPosition {
  symbol: string;
  quantityHeld: string;
  averageCost: string;
  currentPrice: string;
  currentCostBasis: string;
  currentValue: string;
  realizedPnl: string;
  unrealizedPnl: string;
  totalPnl: string;
  allocationPct: string;
  totalFeesPaid: string;
}

export interface PortfolioSummary {
  currentValue: string;
  currentCostBasis: string;
  realizedPnl: string;
  unrealizedPnl: string;
  totalPnl: string;
  totalFeesPaid: string;
  pricesAsOf: string | null;
}

export interface PortfolioSnapshot {
  summary: PortfolioSummary;
  positions: AssetPosition[];
}

export interface TradeRow {
  tradeId: string;
  timestamp: string;
  exchange: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: string;
  priceUsd: string;
  feeUsd: string;
  grossValueUsd: string;
}

export interface TradesResponse {
  items: TradeRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
}
