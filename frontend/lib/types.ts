/**
 * Types strictly aligned with backend OpenAPI 3.0 specification (backend/swagger.json).
 * Numeric and Decimal values are transmitted as JSON strings over HTTP to prevent precision loss.
 */

export interface PortfolioSummaryDto {
  currentValue: string;
  currentCostBasis: string;
  realizedPnl: string;
  unrealizedPnl: string;
  totalPnl: string;
  totalFeesPaid: string;
  pricesAsOf: string | null;
}

export interface HoldingDto {
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

export interface PortfolioSnapshotDto {
  summary: PortfolioSummaryDto;
  positions: HoldingDto[];
}

export interface PriceSnapshotDto {
  asOf: string;
  symbol: string;
  priceUsd: string;
}

export interface PricesResponseDto {
  asOf: string | null;
  prices: PriceSnapshotDto[];
}

export interface TransactionDto {
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

export interface PaginatedTransactionsDto {
  items: TransactionDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ValidationErrorDto {
  row: number;
  field?: string;
  message: string;
}

export interface ImportErrorResponseDto {
  message: string;
  errors: ValidationErrorDto[];
}

export interface ImportResultDto {
  imported: number;
}

export interface ResetResultDto {
  message: string;
  tradesImported: number;
  pricesImported: number;
}

export interface TradesQueryDto {
  symbol?: string;
  exchange?: string;
  side?: string;
  from?: string;
  to?: string;
  sort?: 'asc' | 'desc';
  page?: string | number;
  pageSize?: string | number;
}

// Backward-compatible type aliases
export type AssetPosition = HoldingDto;
export type PortfolioSummary = PortfolioSummaryDto;
export type PortfolioSnapshot = PortfolioSnapshotDto;
export type TradeRow = TransactionDto;
export type TradesResponse = PaginatedTransactionsDto;
export type ImportError = ValidationErrorDto;
