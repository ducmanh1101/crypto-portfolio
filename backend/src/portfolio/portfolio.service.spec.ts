import Decimal from 'decimal.js';
import { PortfolioService, PortfolioStore } from './portfolio.service';
import { TradesController } from '../trades/trades.controller';
import { Trade } from '../calculation/types';

describe('PortfolioService and TradesController Integration', () => {
  let store: PortfolioStore;
  let service: PortfolioService;
  let tradesController: TradesController;

  beforeEach(async () => {
    store = new PortfolioStore();
    service = new PortfolioService(store);
    tradesController = new TradesController(store);

    const testTrades: Trade[] = [
      {
        tradeId: 'T1',
        timestamp: new Date('2026-01-01T10:00:00Z'),
        exchange: 'Binance',
        symbol: 'BTC',
        side: 'BUY',
        quantity: new Decimal('1'),
        priceUsd: new Decimal('40000'),
        feeUsd: new Decimal('10'),
      },
      {
        tradeId: 'T2',
        timestamp: new Date('2026-01-05T12:00:00Z'),
        exchange: 'Coinbase',
        symbol: 'ETH',
        side: 'BUY',
        quantity: new Decimal('10'),
        priceUsd: new Decimal('2000'),
        feeUsd: new Decimal('5'),
      },
      {
        tradeId: 'T3',
        timestamp: new Date('2026-01-10T15:00:00Z'),
        exchange: 'Binance',
        symbol: 'BTC',
        side: 'SELL',
        quantity: new Decimal('0.5'),
        priceUsd: new Decimal('50000'),
        feeUsd: new Decimal('15'),
      },
    ];

    await store.replaceTrades(testTrades);
    await store.setPrices([
      { asOf: new Date('2026-09-19T00:00:00Z'), symbol: 'BTC', priceUsd: new Decimal('60000') },
      { asOf: new Date('2026-09-19T00:00:00Z'), symbol: 'ETH', priceUsd: new Decimal('3000') },
    ]);
  });

  describe('PortfolioService', () => {
    it('returns formatted snapshot with summary and positions', async () => {
      const snapshot = await service.getSnapshot();
      expect(snapshot.summary).toBeDefined();
      expect(snapshot.positions).toHaveLength(2);

      const btc = snapshot.positions.find((p) => p.symbol === 'BTC')!;
      expect(btc.quantityHeld).toBe('0.5');
      // BTC avg cost = 40010, currentValue = 0.5 * 60000 = 30000
      expect(btc.currentValue).toBe('30000');
    });

    it('returns portfolio summary only', async () => {
      const summary = await service.getSummary();
      expect(summary.currentValue).toBeDefined();
      expect(summary.currentCostBasis).toBeDefined();
      expect(summary.totalPnl).toBeDefined();
    });

    it('returns holdings only', async () => {
      const holdings = await service.getHoldings();
      expect(holdings).toHaveLength(2);
      expect(holdings.map((h) => h.symbol).sort()).toEqual(['BTC', 'ETH']);
    });

    it('returns current prices and asOf', async () => {
      const prices = await service.getPrices();
      expect(prices.asOf).toBe('2026-09-19T00:00:00.000Z');
      expect(prices.prices).toHaveLength(2);
    });
  });

  describe('TradesController', () => {
    it('lists all trades sorted descending by default', async () => {
      const result = await tradesController.list({});
      expect(result.total).toBe(3);
      expect(result.items[0].tradeId).toBe('T3');
      expect(result.items[2].tradeId).toBe('T1');
      expect(result.items[0].grossValueUsd).toBe('25000');
    });

    it('sorts ascending by timestamp when requested', async () => {
      const result = await tradesController.list({ sort: 'asc' });
      expect(result.items[0].tradeId).toBe('T1');
      expect(result.items[2].tradeId).toBe('T3');
    });

    it('filters by symbol (case-insensitive)', async () => {
      const result = await tradesController.list({ symbol: 'btc' });
      expect(result.total).toBe(2);
      expect(result.items.every((i) => i.symbol === 'BTC')).toBe(true);
    });

    it('filters by exchange (case-insensitive)', async () => {
      const result = await tradesController.list({ exchange: 'coinbase' });
      expect(result.total).toBe(1);
      expect(result.items[0].tradeId).toBe('T2');
    });

    it('filters by side (case-insensitive)', async () => {
      const result = await tradesController.list({ side: 'sell' });
      expect(result.total).toBe(1);
      expect(result.items[0].tradeId).toBe('T3');
    });

    it('filters by date range (from and to)', async () => {
      const result = await tradesController.list({
        from: '2026-01-02',
        to: '2026-01-08',
      });
      expect(result.total).toBe(1);
      expect(result.items[0].tradeId).toBe('T2');
    });

    it('paginates results accurately', async () => {
      const page1 = await tradesController.list({ page: '1', pageSize: '2' });
      expect(page1.items).toHaveLength(2);
      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(2);
      expect(page1.total).toBe(3);

      const page2 = await tradesController.list({ page: '2', pageSize: '2' });
      expect(page2.items).toHaveLength(1);
      expect(page2.page).toBe(2);
    });
  });
});

