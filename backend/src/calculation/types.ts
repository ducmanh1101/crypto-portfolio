/**
 * Core domain types for the portfolio calculation engine.
 *
 * IMPORTANT: All monetary/quantity fields use `Decimal` (decimal.js) internally
 * to avoid floating point rounding errors compounding over ~200 sequential
 * trades. Only convert to `number`/string at the presentation boundary
 * (DTOs sent to the frontend), where we round for display.
 */
import Decimal from 'decimal.js';

export type Exchange = 'Binance' | 'Coinbase';
export type Side = 'BUY' | 'SELL';
export type Symbol = 'BTC' | 'ETH' | 'SOL' | 'CKB' | 'DOGE';

/** Raw row as parsed from trades.csv, already type-coerced. */
export interface Trade {
  tradeId: string;
  timestamp: Date;
  exchange: Exchange;
  symbol: Symbol;
  side: Side;
  quantity: Decimal;
  priceUsd: Decimal;
  feeUsd: Decimal;
}

/** Transaction is an alias for Trade in domain terminology */
export type Transaction = Trade;

/** Raw row as parsed from prices.csv. */
export interface PriceSnapshot {
  asOf: Date;
  symbol: Symbol;
  priceUsd: Decimal;
}

/** Running state for one asset while replaying its trade history in order. */
export interface AssetState {
  symbol: Symbol;
  quantity: Decimal; // units currently held
  costBasis: Decimal; // total USD cost basis of current holdings
  realizedPnl: Decimal; // cumulative realized P&L across all sells
  totalFeesPaid: Decimal; // cumulative BUY + SELL fees
}

/** Fully computed position for one asset. */
export interface AssetPosition {
  symbol: Symbol;
  quantityHeld: Decimal;
  averageCost: Decimal; // 0 when quantityHeld is 0
  currentPrice: Decimal;
  currentCostBasis: Decimal;
  currentValue: Decimal;
  realizedPnl: Decimal;
  unrealizedPnl: Decimal;
  totalPnl: Decimal;
  allocationPct: Decimal; // 0..1, of portfolio current value
  totalFeesPaid: Decimal;
}

/** Holding is an alias for AssetPosition in domain terminology */
export type Holding = AssetPosition;

export interface PortfolioSummary {
  currentValue: Decimal;
  currentCostBasis: Decimal;
  realizedPnl: Decimal;
  unrealizedPnl: Decimal;
  totalPnl: Decimal;
  totalFeesPaid: Decimal;
  pricesAsOf: Date | null;
}

export interface PortfolioSnapshot {
  summary: PortfolioSummary;
  positions: AssetPosition[];
}

/** Structured, actionable validation error for one row of trades.csv. */
export interface ValidationError {
  row: number; // 1-based row number in the source file (header excluded), or 0 for header error, -1 for cross-row
  field?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ImportResult {
  imported: number;
}

// -------------------------------------------------------------
// API / Presentation Boundary DTOs (imported & re-exported from api.dto.ts)
// -------------------------------------------------------------
import {
  PortfolioSummaryDto,
  HoldingDto,
  PortfolioSnapshotDto,
  PriceSnapshotDto,
  PricesResponseDto,
  TransactionDto,
  PaginatedTransactionsDto,
  ImportResultDto,
  ResetResultDto,
  ValidationErrorDto,
  ImportErrorResponseDto,
  TradesQueryDto,
  FileUploadDto,
} from '../dto/api.dto';

export {
  PortfolioSummaryDto,
  HoldingDto,
  PortfolioSnapshotDto,
  PriceSnapshotDto,
  PricesResponseDto,
  TransactionDto,
  PaginatedTransactionsDto,
  ImportResultDto,
  ResetResultDto,
  ValidationErrorDto,
  ImportErrorResponseDto,
  TradesQueryDto,
  FileUploadDto,
};

// -------------------------------------------------------------
// Conversion Helpers
// -------------------------------------------------------------

export function toHoldingDto(pos: AssetPosition): HoldingDto {
  return {
    symbol: pos.symbol,
    quantityHeld: pos.quantityHeld.toString(),
    averageCost: pos.averageCost.toString(),
    currentPrice: pos.currentPrice.toString(),
    currentCostBasis: pos.currentCostBasis.toString(),
    currentValue: pos.currentValue.toString(),
    realizedPnl: pos.realizedPnl.toString(),
    unrealizedPnl: pos.unrealizedPnl.toString(),
    totalPnl: pos.totalPnl.toString(),
    allocationPct: pos.allocationPct.toString(),
    totalFeesPaid: pos.totalFeesPaid.toString(),
  };
}

export function toSummaryDto(summary: PortfolioSummary): PortfolioSummaryDto {
  return {
    currentValue: summary.currentValue.toString(),
    currentCostBasis: summary.currentCostBasis.toString(),
    realizedPnl: summary.realizedPnl.toString(),
    unrealizedPnl: summary.unrealizedPnl.toString(),
    totalPnl: summary.totalPnl.toString(),
    totalFeesPaid: summary.totalFeesPaid.toString(),
    pricesAsOf: summary.pricesAsOf ? summary.pricesAsOf.toISOString() : null,
  };
}

export function toSnapshotDto(snapshot: PortfolioSnapshot): PortfolioSnapshotDto {
  return {
    summary: toSummaryDto(snapshot.summary),
    positions: snapshot.positions.map(toHoldingDto),
  };
}

export function toTransactionDto(trade: Trade): TransactionDto {
  return {
    tradeId: trade.tradeId,
    timestamp: trade.timestamp.toISOString(),
    exchange: trade.exchange,
    symbol: trade.symbol,
    side: trade.side,
    quantity: trade.quantity.toString(),
    priceUsd: trade.priceUsd.toString(),
    feeUsd: trade.feeUsd.toString(),
    grossValueUsd: trade.quantity.times(trade.priceUsd).toString(),
  };
}
