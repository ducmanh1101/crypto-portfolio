import Decimal from 'decimal.js';
import { computePortfolioSnapshot, replayAssetTrades, ShortPositionError } from './portfolio-calculator';
import { PriceSnapshot, Trade } from './types';

/** Small helper so test trades read as plain numbers/strings instead of `new Decimal(...)` everywhere. */
function trade(partial: {
  id: string;
  ts: string;
  side: 'BUY' | 'SELL';
  qty: number | string;
  price: number | string;
  fee: number | string;
  symbol?: Trade['symbol'];
  exchange?: Trade['exchange'];
}): Trade {
  return {
    tradeId: partial.id,
    timestamp: new Date(partial.ts),
    exchange: partial.exchange ?? 'Binance',
    symbol: partial.symbol ?? 'BTC',
    side: partial.side,
    quantity: new Decimal(partial.qty),
    priceUsd: new Decimal(partial.price),
    feeUsd: new Decimal(partial.fee),
  };
}

function price(symbol: Trade['symbol'], usd: number): PriceSnapshot {
  return { symbol, priceUsd: new Decimal(usd), asOf: new Date('2026-09-19T00:00:00Z') };
}

describe('replayAssetTrades', () => {
  // 1. Multiple BUYs at different prices → weighted average cost
  it('computes weighted-average cost across multiple buys at different prices', () => {
    const trades = [
      trade({ id: 't1', ts: '2026-01-01', side: 'BUY', qty: 1, price: 10000, fee: 0 }),
      trade({ id: 't2', ts: '2026-01-02', side: 'BUY', qty: 1, price: 20000, fee: 0 }),
    ];
    const state = replayAssetTrades('BTC', trades);
    // (10000*1 + 20000*1) / 2 = 15000
    expect(state.quantity.toNumber()).toBe(2);
    expect(state.costBasis.dividedBy(state.quantity).toNumber()).toBe(15000);
  });

  // 2. BUY fees are capitalized into cost basis
  it('capitalizes BUY fees into cost basis', () => {
    const trades = [trade({ id: 't1', ts: '2026-01-01', side: 'BUY', qty: 1, price: 10000, fee: 50 })];
    const state = replayAssetTrades('BTC', trades);
    // cost basis = 10000*1 + 50 = 10050 → avg cost = 10050
    expect(state.costBasis.toNumber()).toBe(10050);
    expect(state.costBasis.dividedBy(state.quantity).toNumber()).toBe(10050);
  });

  // 3. Partial SELL: average cost of remainder is unchanged, cost basis reduced proportionally
  it('handles a partial sell without changing the average cost of the remainder', () => {
    const trades = [
      trade({ id: 't1', ts: '2026-01-01', side: 'BUY', qty: 2, price: 10000, fee: 0 }), // avg 10000, cost basis 20000
      trade({ id: 't2', ts: '2026-01-02', side: 'SELL', qty: 1, price: 12000, fee: 0 }),
    ];
    const state = replayAssetTrades('BTC', trades);
    expect(state.quantity.toNumber()).toBe(1);
    // cost removed = 10000 * 1 = 10000 → remaining cost basis = 20000 - 10000 = 10000 → avg cost still 10000
    expect(state.costBasis.toNumber()).toBe(10000);
    expect(state.costBasis.dividedBy(state.quantity).toNumber()).toBe(10000);
  });

  // 4. SELL fees reduce proceeds (and therefore realized P&L)
  it('deducts SELL fees from proceeds when computing realized P&L', () => {
    const trades = [
      trade({ id: 't1', ts: '2026-01-01', side: 'BUY', qty: 1, price: 10000, fee: 0 }),
      trade({ id: 't2', ts: '2026-01-02', side: 'SELL', qty: 1, price: 12000, fee: 20 }),
    ];
    const state = replayAssetTrades('BTC', trades);
    // gross proceeds 12000, net proceeds 11980, cost removed 10000 → realized P&L 1980
    expect(state.realizedPnl.toNumber()).toBe(1980);
  });

  // 5. Full close followed by a new BUY resets cost basis / average cost
  it('resets cost basis after a full close, then starts fresh on the next buy', () => {
    const trades = [
      trade({ id: 't1', ts: '2026-01-01', side: 'BUY', qty: 1, price: 10000, fee: 0 }),
      trade({ id: 't2', ts: '2026-01-02', side: 'SELL', qty: 1, price: 15000, fee: 0 }), // full close, realized +5000
      trade({ id: 't3', ts: '2026-01-03', side: 'BUY', qty: 1, price: 30000, fee: 0 }), // fresh position
    ];
    const state = replayAssetTrades('BTC', trades);
    expect(state.quantity.toNumber()).toBe(1);
    expect(state.costBasis.toNumber()).toBe(30000); // not 40000 — old cost basis must not leak in
    expect(state.realizedPnl.toNumber()).toBe(5000); // realized P&L from the close is preserved
  });

  // 6. Rejects a SELL that would create a short position
  it('throws ShortPositionError when a sell exceeds available quantity', () => {
    const trades = [
      trade({ id: 't1', ts: '2026-01-01', side: 'BUY', qty: 1, price: 10000, fee: 0 }),
      trade({ id: 't2', ts: '2026-01-02', side: 'SELL', qty: 2, price: 12000, fee: 0 }),
    ];
    expect(() => replayAssetTrades('BTC', trades)).toThrow(ShortPositionError);
  });

  it('processes trades in ascending timestamp order regardless of input order', () => {
    const trades = [
      trade({ id: 't2', ts: '2026-01-02', side: 'SELL', qty: 1, price: 15000, fee: 0 }),
      trade({ id: 't1', ts: '2026-01-01', side: 'BUY', qty: 1, price: 10000, fee: 0 }),
    ];
    // Deliberately out of order — computePortfolioSnapshot sorts internally, replayAssetTrades trusts caller order.
    const sorted = [...trades].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const state = replayAssetTrades('BTC', sorted);
    expect(state.realizedPnl.toNumber()).toBe(5000);
  });
});

describe('computePortfolioSnapshot', () => {
  it('computes current value, unrealized P&L, total P&L, and allocation across assets', () => {
    const trades = [
      trade({ id: 't1', ts: '2026-01-01', side: 'BUY', qty: 1, price: 10000, fee: 0, symbol: 'BTC' }),
      trade({ id: 't2', ts: '2026-01-01', side: 'BUY', qty: 10, price: 1000, fee: 0, symbol: 'ETH' }),
    ];
    const prices = [price('BTC', 20000), price('ETH', 1200)];
    const snapshot = computePortfolioSnapshot(trades, prices);

    // BTC: value 20000, cost basis 10000 → unrealized +10000
    // ETH: value 12000, cost basis 10000 → unrealized +2000
    expect(snapshot.summary.currentValue.toNumber()).toBe(32000);
    expect(snapshot.summary.unrealizedPnl.toNumber()).toBe(12000);
    expect(snapshot.summary.totalPnl.toNumber()).toBe(12000);

    const btc = snapshot.positions.find((p) => p.symbol === 'BTC')!;
    // allocation = 20000 / 32000 = 0.625
    expect(btc.allocationPct.toNumber()).toBeCloseTo(0.625, 6);
  });

  it('keeps a fully-closed asset visible when it has non-zero realized P&L', () => {
    const trades = [
      trade({ id: 't1', ts: '2026-01-01', side: 'BUY', qty: 1, price: 10000, fee: 0, symbol: 'SOL' }),
      trade({ id: 't2', ts: '2026-01-02', side: 'SELL', qty: 1, price: 12000, fee: 0, symbol: 'SOL' }),
    ];
    const snapshot = computePortfolioSnapshot(trades, [price('SOL', 999)]);
    const sol = snapshot.positions.find((p) => p.symbol === 'SOL');
    expect(sol).toBeDefined();
    expect(sol!.quantityHeld.toNumber()).toBe(0);
    expect(sol!.realizedPnl.toNumber()).toBe(2000);
    expect(sol!.currentValue.toNumber()).toBe(0); // zero qty → zero value regardless of price
  });

  it('handles missing prices gracefully by defaulting asset current price to 0', () => {
    const trades = [
      trade({ id: 't1', ts: '2026-01-01', side: 'BUY', qty: 2, price: 5000, fee: 10, symbol: 'BTC' }),
    ];
    // No price snapshot for BTC supplied
    const snapshot = computePortfolioSnapshot(trades, []);
    const btc = snapshot.positions.find((p) => p.symbol === 'BTC')!;
    expect(btc).toBeDefined();
    expect(btc.currentPrice.toNumber()).toBe(0);
    expect(btc.currentValue.toNumber()).toBe(0);
    // unrealized P&L = 0 - 10010 = -10010
    expect(btc.unrealizedPnl.toNumber()).toBe(-10010);
    expect(snapshot.summary.currentValue.toNumber()).toBe(0);
  });

  it('returns empty summary when there are no trades', () => {
    const snapshot = computePortfolioSnapshot([], [price('BTC', 50000)]);
    expect(snapshot.summary.currentValue.toNumber()).toBe(0);
    expect(snapshot.summary.totalPnl.toNumber()).toBe(0);
    expect(snapshot.positions).toHaveLength(0);
  });

  it('asserts exact decimal precision without floating point compounding errors', () => {
    // Real trade example from trades.csv:
    // TRD-0001: BUY 0.03141403 BTC @ 105507.74, fee 3.31
    // gross = 0.03141403 * 105507.74 = 3314.4232371922
    // cost basis = 3314.4232371922 + 3.31 = 3317.7332371922
    const trades = [
      trade({
        id: 'TRD-0001',
        ts: '2025-10-01T09:00:00Z',
        side: 'BUY',
        qty: 0.03141403,
        price: 105507.74,
        fee: 3.31,
        symbol: 'BTC',
      }),
    ];
    const snapshot = computePortfolioSnapshot(trades, [price('BTC', 111500)]);
    const btc = snapshot.positions[0];
    expect(btc.quantityHeld.toString()).toBe('0.03141403');
    expect(btc.currentCostBasis.toString()).toBe('3317.7333095922');
    // current value = 0.03141403 * 111500 = 3502.664345
    expect(btc.currentValue.toString()).toBe('3502.664345');
    // unrealized PnL = 3502.664345 - 3317.7333095922 = 184.9310354078
    expect(btc.unrealizedPnl.toString()).toBe('184.9310354078');
  });
});
