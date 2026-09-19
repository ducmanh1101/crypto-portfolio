import Decimal from 'decimal.js';
import {
  AssetPosition,
  AssetState,
  PortfolioSnapshot,
  PortfolioSummary,
  PriceSnapshot,
  Trade,
} from './types';

/**
 * Thrown when a trade sequence would require a short position
 * (SELL quantity exceeds what is held at that point in time).
 * The import layer should catch this during validation, but the
 * calculation engine re-checks it defensively — it must never
 * silently produce a negative quantity.
 */
export class ShortPositionError extends Error {
  constructor(
    public readonly tradeId: string,
    public readonly symbol: string,
    public readonly available: Decimal,
    public readonly requested: Decimal,
  ) {
    super(
      `Trade ${tradeId}: SELL ${requested.toString()} ${symbol} exceeds available balance ${available.toString()}`,
    );
    this.name = 'ShortPositionError';
  }
}

function emptyAssetState(symbol: Trade['symbol']): AssetState {
  return {
    symbol,
    quantity: new Decimal(0),
    costBasis: new Decimal(0),
    realizedPnl: new Decimal(0),
    totalFeesPaid: new Decimal(0),
  };
}

/**
 * Replays one asset's trades (already sorted ascending by timestamp) and
 * returns the resulting AssetState. This is the heart of the assignment's
 * calculation rules — see README.md "Portfolio calculation approach" for
 * the worked formulas this implements.
 */
export function replayAssetTrades(symbol: Trade['symbol'], trades: Trade[]): AssetState {
  let state = emptyAssetState(symbol);

  for (const trade of trades) {
    if (trade.side === 'BUY') {
      state = applyBuy(state, trade);
    } else {
      state = applySell(state, trade);
    }
  }

  return state;
}

function applyBuy(state: AssetState, trade: Trade): AssetState {
  const grossBuyValue = trade.quantity.times(trade.priceUsd);
  const costAdded = grossBuyValue.plus(trade.feeUsd);

  const newQuantity = state.quantity.plus(trade.quantity);
  const newCostBasis = state.costBasis.plus(costAdded);

  return {
    ...state,
    quantity: newQuantity,
    costBasis: newCostBasis,
    totalFeesPaid: state.totalFeesPaid.plus(trade.feeUsd),
  };
}

function applySell(state: AssetState, trade: Trade): AssetState {
  if (trade.quantity.greaterThan(state.quantity)) {
    throw new ShortPositionError(trade.tradeId, trade.symbol, state.quantity, trade.quantity);
  }

  // Average cost BEFORE this sale — a SELL never changes average cost
  // of the remaining position, so we must snapshot it first.
  const averageCostBeforeSale = state.quantity.isZero()
    ? new Decimal(0)
    : state.costBasis.dividedBy(state.quantity);

  const grossProceeds = trade.quantity.times(trade.priceUsd);
  const netProceeds = grossProceeds.minus(trade.feeUsd);
  const costRemoved = averageCostBeforeSale.times(trade.quantity);
  const realizedPnlOnSale = netProceeds.minus(costRemoved);

  let newQuantity = state.quantity.minus(trade.quantity);
  let newCostBasis = state.costBasis.minus(costRemoved);

  // Full close: reset to exactly zero to avoid dust from Decimal division
  // rounding, and so a later re-BUY starts a clean new average cost.
  if (newQuantity.isZero()) {
    newCostBasis = new Decimal(0);
  }

  return {
    ...state,
    quantity: newQuantity,
    costBasis: newCostBasis,
    realizedPnl: state.realizedPnl.plus(realizedPnlOnSale),
    totalFeesPaid: state.totalFeesPaid.plus(trade.feeUsd),
  };
}

function toPosition(state: AssetState, currentPrice: Decimal | undefined): AssetPosition {
  const price = currentPrice ?? new Decimal(0);
  const averageCost = state.quantity.isZero() ? new Decimal(0) : state.costBasis.dividedBy(state.quantity);
  const currentValue = state.quantity.times(price);
  const unrealizedPnl = currentValue.minus(state.costBasis);
  const totalPnl = state.realizedPnl.plus(unrealizedPnl);

  return {
    symbol: state.symbol,
    quantityHeld: state.quantity,
    averageCost,
    currentPrice: price,
    currentCostBasis: state.costBasis,
    currentValue,
    realizedPnl: state.realizedPnl,
    unrealizedPnl,
    totalPnl,
    allocationPct: new Decimal(0), // filled in below once total portfolio value is known
    totalFeesPaid: state.totalFeesPaid,
  };
}

/**
 * Computes the full portfolio snapshot from a full trade history and a
 * current price snapshot. Trades do not need to be pre-sorted globally —
 * they are grouped by symbol and sorted ascending by timestamp internally,
 * per the assignment's "process transactions in ascending timestamp order
 * for each asset" rule.
 *
 * Assets with zero holdings but non-zero realized P&L are still included
 * in the result (per "Closed assets may remain visible").
 */
export function computePortfolioSnapshot(
  trades: Trade[],
  prices: PriceSnapshot[],
): PortfolioSnapshot {
  const priceBySymbol = new Map(prices.map((p) => [p.symbol, p.priceUsd]));
  const pricesAsOf = prices.length > 0 ? prices[0].asOf : null;

  const tradesBySymbol = new Map<string, Trade[]>();
  for (const trade of trades) {
    const list = tradesBySymbol.get(trade.symbol) ?? [];
    list.push(trade);
    tradesBySymbol.set(trade.symbol, list);
  }

  const positions: AssetPosition[] = [];
  for (const [symbol, symbolTrades] of tradesBySymbol) {
    const sorted = [...symbolTrades].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const state = replayAssetTrades(symbol as Trade['symbol'], sorted);

    // Skip assets that are both empty and have never realized any P&L —
    // nothing meaningful to show.
    if (state.quantity.isZero() && state.realizedPnl.isZero() && state.totalFeesPaid.isZero()) {
      continue;
    }

    positions.push(toPosition(state, priceBySymbol.get(symbol as Trade['symbol'])));
  }

  const currentValue = positions.reduce((sum, p) => sum.plus(p.currentValue), new Decimal(0));

  // Second pass: now that total portfolio value is known, fill in allocation %.
  for (const position of positions) {
    position.allocationPct = currentValue.isZero()
      ? new Decimal(0)
      : position.currentValue.dividedBy(currentValue);
  }

  const summary: PortfolioSummary = {
    currentValue,
    currentCostBasis: positions.reduce((sum, p) => sum.plus(p.currentCostBasis), new Decimal(0)),
    realizedPnl: positions.reduce((sum, p) => sum.plus(p.realizedPnl), new Decimal(0)),
    unrealizedPnl: positions.reduce((sum, p) => sum.plus(p.unrealizedPnl), new Decimal(0)),
    totalPnl: positions.reduce((sum, p) => sum.plus(p.totalPnl), new Decimal(0)),
    totalFeesPaid: positions.reduce((sum, p) => sum.plus(p.totalFeesPaid), new Decimal(0)),
    pricesAsOf,
  };

  positions.sort((a, b) => b.currentValue.comparedTo(a.currentValue));

  return { summary, positions };
}
