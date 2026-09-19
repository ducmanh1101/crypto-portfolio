import {
  isValidUtcIso8601,
  validateColumns,
  validateImport,
  validatePricesImport,
} from './csv-validator';

describe('CSV Validator', () => {
  const validHeader = [
    'trade_id',
    'timestamp',
    'exchange',
    'symbol',
    'side',
    'quantity',
    'price_usd',
    'fee_usd',
  ];

  describe('isValidUtcIso8601', () => {
    it('accepts valid UTC ISO-8601 strings', () => {
      expect(isValidUtcIso8601('2026-01-05T09:12:00Z')).toBe(true);
      expect(isValidUtcIso8601('2026-01-05T09:12:00.123Z')).toBe(true);
      expect(isValidUtcIso8601('2026-01-05T09:12:00+00:00')).toBe(true);
    });

    it('rejects invalid or non-UTC strings', () => {
      expect(isValidUtcIso8601('2026-01-05')).toBe(false);
      expect(isValidUtcIso8601('2026-01-05 09:12:00')).toBe(false);
      expect(isValidUtcIso8601('2026-01-05T09:12:00')).toBe(false);
      expect(isValidUtcIso8601('invalid-date')).toBe(false);
      expect(isValidUtcIso8601('')).toBe(false);
    });
  });

  describe('validateColumns', () => {
    it('returns empty array when all required columns exist', () => {
      expect(validateColumns(validHeader)).toEqual([]);
    });

    it('returns actionable errors when required columns are missing', () => {
      const incomplete = ['trade_id', 'timestamp', 'symbol'];
      const errors = validateColumns(incomplete);
      expect(errors.length).toBe(5);
      expect(errors.some((e) => e.field === 'exchange')).toBe(true);
      expect(errors.some((e) => e.field === 'price_usd')).toBe(true);
    });
  });

  describe('validateImport', () => {
    it('validates a correct trade CSV row successfully', () => {
      const rows = [
        {
          trade_id: 't001',
          timestamp: '2026-01-05T09:12:00Z',
          exchange: 'Binance',
          symbol: 'BTC',
          side: 'BUY',
          quantity: '0.5',
          price_usd: '42000',
          fee_usd: '10.5',
        },
      ];

      const result = validateImport(validHeader, rows);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.trades).toHaveLength(1);
      expect(result.trades[0].tradeId).toBe('t001');
      expect(result.trades[0].quantity.toString()).toBe('0.5');
    });

    it('rejects missing or empty trade_id', () => {
      const rows = [
        {
          trade_id: '',
          timestamp: '2026-01-05T09:12:00Z',
          exchange: 'Binance',
          symbol: 'BTC',
          side: 'BUY',
          quantity: '0.5',
          price_usd: '42000',
          fee_usd: '10',
        },
      ];
      const result = validateImport(validHeader, rows);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'trade_id')).toBe(true);
    });

    it('rejects duplicate trade_id rows atomically', () => {
      const rows = [
        {
          trade_id: 't001',
          timestamp: '2026-01-05T09:12:00Z',
          exchange: 'Binance',
          symbol: 'BTC',
          side: 'BUY',
          quantity: '0.5',
          price_usd: '42000',
          fee_usd: '10',
        },
        {
          trade_id: 't001', // duplicate
          timestamp: '2026-01-06T09:12:00Z',
          exchange: 'Coinbase',
          symbol: 'BTC',
          side: 'BUY',
          quantity: '0.5',
          price_usd: '43000',
          fee_usd: '10',
        },
      ];
      const result = validateImport(validHeader, rows);
      expect(result.valid).toBe(false);
      expect(result.trades).toHaveLength(0); // atomic
      expect(result.errors.some((e) => e.message.includes('Duplicate trade_id'))).toBe(true);
    });

    it('rejects unsupported exchanges, symbols, or sides', () => {
      const rows = [
        {
          trade_id: 't001',
          timestamp: '2026-01-05T09:12:00Z',
          exchange: 'Kraken', // unsupported
          symbol: 'XRP', // unsupported
          side: 'HOLD', // unsupported
          quantity: '1',
          price_usd: '100',
          fee_usd: '1',
        },
      ];
      const result = validateImport(validHeader, rows);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'exchange')).toBe(true);
      expect(result.errors.some((e) => e.field === 'symbol')).toBe(true);
      expect(result.errors.some((e) => e.field === 'side')).toBe(true);
    });

    it('rejects quantity <= 0 or invalid number', () => {
      const rows = [
        {
          trade_id: 't001',
          timestamp: '2026-01-05T09:12:00Z',
          exchange: 'Binance',
          symbol: 'BTC',
          side: 'BUY',
          quantity: '-0.5',
          price_usd: '42000',
          fee_usd: '10',
        },
      ];
      const result = validateImport(validHeader, rows);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'quantity')).toBe(true);
    });

    it('rejects price_usd <= 0', () => {
      const rows = [
        {
          trade_id: 't001',
          timestamp: '2026-01-05T09:12:00Z',
          exchange: 'Binance',
          symbol: 'BTC',
          side: 'BUY',
          quantity: '1',
          price_usd: '0',
          fee_usd: '10',
        },
      ];
      const result = validateImport(validHeader, rows);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'price_usd')).toBe(true);
    });

    it('rejects fee_usd < 0', () => {
      const rows = [
        {
          trade_id: 't001',
          timestamp: '2026-01-05T09:12:00Z',
          exchange: 'Binance',
          symbol: 'BTC',
          side: 'BUY',
          quantity: '1',
          price_usd: '40000',
          fee_usd: '-5',
        },
      ];
      const result = validateImport(validHeader, rows);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'fee_usd')).toBe(true);
    });

    it('rejects cross-row short positions where SELL exceeds available quantity', () => {
      const rows = [
        {
          trade_id: 't001',
          timestamp: '2026-01-05T09:12:00Z',
          exchange: 'Binance',
          symbol: 'BTC',
          side: 'BUY',
          quantity: '1',
          price_usd: '40000',
          fee_usd: '10',
        },
        {
          trade_id: 't002',
          timestamp: '2026-01-06T09:12:00Z',
          exchange: 'Binance',
          symbol: 'BTC',
          side: 'SELL',
          quantity: '1.5', // exceeds 1
          price_usd: '42000',
          fee_usd: '10',
        },
      ];
      const result = validateImport(validHeader, rows);
      expect(result.valid).toBe(false);
      expect(result.trades).toHaveLength(0);
      expect(result.errors.some((e) => e.message.includes('exceeds available balance'))).toBe(true);
    });
  });

  describe('validatePricesImport', () => {
    const priceHeader = ['as_of', 'symbol', 'price_usd'];

    it('validates correct prices rows successfully', () => {
      const rows = [
        {
          as_of: '2026-09-19T00:00:00Z',
          symbol: 'BTC',
          price_usd: '61000',
        },
      ];
      const result = validatePricesImport(priceHeader, rows);
      expect(result.valid).toBe(true);
      expect(result.prices).toHaveLength(1);
    });

    it('rejects missing columns in prices header', () => {
      const result = validatePricesImport(['as_of', 'symbol'], []);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'price_usd')).toBe(true);
    });

    it('rejects invalid timestamp or price in prices row', () => {
      const rows = [
        {
          as_of: 'invalid-date',
          symbol: 'UNKNOWN',
          price_usd: '-10',
        },
      ];
      const result = validatePricesImport(priceHeader, rows);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});

