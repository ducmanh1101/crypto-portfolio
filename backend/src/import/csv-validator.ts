import Decimal from 'decimal.js';
import {
  Exchange,
  PriceSnapshot,
  Side,
  Symbol,
  Trade,
  ValidationError,
  ValidationResult,
} from '../calculation/types';
import { replayAssetTrades, ShortPositionError } from '../calculation/portfolio-calculator';

export const VALID_EXCHANGES: readonly Exchange[] = ['Binance', 'Coinbase'] as const;
export const VALID_SIDES: readonly Side[] = ['BUY', 'SELL'] as const;
export const VALID_SYMBOLS: readonly Symbol[] = ['BTC', 'ETH', 'SOL', 'CKB', 'DOGE'] as const;

export const REQUIRED_TRADE_COLUMNS = [
  'trade_id',
  'timestamp',
  'exchange',
  'symbol',
  'side',
  'quantity',
  'price_usd',
  'fee_usd',
];

export const REQUIRED_PRICE_COLUMNS = ['as_of', 'symbol', 'price_usd'];

const ISO_8601_UTC_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]00:?00)$/;

export function isValidUtcIso8601(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  if (!ISO_8601_UTC_REGEX.test(val.trim())) return false;
  const ts = Date.parse(val.trim());
  return !isNaN(ts);
}

/** One raw CSV row, still strings — as returned by the CSV parser before type coercion. */
export type RawCsvRow = Record<string, string>;

export function validateColumns(header: string[], required: string[] = REQUIRED_TRADE_COLUMNS): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const col of required) {
    if (!header.includes(col)) {
      errors.push({ row: 0, field: col, message: `Missing required column "${col}"` });
    }
  }
  return errors;
}

/**
 * Validates and coerces raw CSV rows into typed Trade objects.
 * Row-level checks only (uniqueness, format, ranges). The cross-row
 * short-position check runs separately in `validateNoShortPositions`,
 * since it requires the full, sorted history per asset.
 */
export function validateAndParseRows(rows: RawCsvRow[]): {
  trades: Trade[];
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];
  const trades: Trade[] = [];
  const seenIds = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 1; // 1-based, header excluded
    const rowErrors: ValidationError[] = [];

    const tradeId = row.trade_id?.trim();
    if (!tradeId) {
      rowErrors.push({ row: rowNum, field: 'trade_id', message: 'trade_id is required' });
    } else if (seenIds.has(tradeId)) {
      rowErrors.push({ row: rowNum, field: 'trade_id', message: `Duplicate trade_id "${tradeId}"` });
    } else {
      seenIds.add(tradeId);
    }

    const rawTimestamp = row.timestamp?.trim();
    if (!rawTimestamp || !isValidUtcIso8601(rawTimestamp)) {
      rowErrors.push({
        row: rowNum,
        field: 'timestamp',
        message: `Invalid UTC ISO-8601 timestamp "${row.timestamp}" (expected format YYYY-MM-DDTHH:mm:ssZ)`,
      });
    }

    const exchange = row.exchange?.trim() as Exchange;
    if (!VALID_EXCHANGES.includes(exchange)) {
      rowErrors.push({
        row: rowNum,
        field: 'exchange',
        message: `Unsupported exchange "${row.exchange}" (must be ${VALID_EXCHANGES.join(' or ')})`,
      });
    }

    const symbol = row.symbol?.trim() as Symbol;
    if (!VALID_SYMBOLS.includes(symbol)) {
      rowErrors.push({
        row: rowNum,
        field: 'symbol',
        message: `Unsupported symbol "${row.symbol}" (must be one of ${VALID_SYMBOLS.join(', ')})`,
      });
    }

    const side = row.side?.trim() as Side;
    if (!VALID_SIDES.includes(side)) {
      rowErrors.push({
        row: rowNum,
        field: 'side',
        message: `Unsupported side "${row.side}" (must be BUY or SELL)`,
      });
    }

    let quantity: Decimal | undefined;
    try {
      if (!row.quantity || row.quantity.trim() === '') {
        rowErrors.push({ row: rowNum, field: 'quantity', message: 'quantity is required' });
      } else {
        quantity = new Decimal(row.quantity.trim());
        if (!quantity.greaterThan(0)) {
          rowErrors.push({ row: rowNum, field: 'quantity', message: 'quantity must be greater than zero' });
        }
      }
    } catch {
      rowErrors.push({ row: rowNum, field: 'quantity', message: `Invalid quantity "${row.quantity}"` });
    }

    let priceUsd: Decimal | undefined;
    try {
      if (!row.price_usd || row.price_usd.trim() === '') {
        rowErrors.push({ row: rowNum, field: 'price_usd', message: 'price_usd is required' });
      } else {
        priceUsd = new Decimal(row.price_usd.trim());
        if (!priceUsd.greaterThan(0)) {
          rowErrors.push({ row: rowNum, field: 'price_usd', message: 'price_usd must be greater than zero' });
        }
      }
    } catch {
      rowErrors.push({ row: rowNum, field: 'price_usd', message: `Invalid price_usd "${row.price_usd}"` });
    }

    let feeUsd: Decimal | undefined;
    try {
      if (row.fee_usd === undefined || row.fee_usd === null || row.fee_usd.trim() === '') {
        rowErrors.push({ row: rowNum, field: 'fee_usd', message: 'fee_usd is required' });
      } else {
        feeUsd = new Decimal(row.fee_usd.trim());
        if (feeUsd.lessThan(0)) {
          rowErrors.push({ row: rowNum, field: 'fee_usd', message: 'fee_usd must be zero or greater' });
        }
      }
    } catch {
      rowErrors.push({ row: rowNum, field: 'fee_usd', message: `Invalid fee_usd "${row.fee_usd}"` });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    trades.push({
      tradeId: tradeId!,
      timestamp: new Date(rawTimestamp!),
      exchange,
      symbol,
      side,
      quantity: quantity!,
      priceUsd: priceUsd!,
      feeUsd: feeUsd!,
    });
  });

  return { trades, errors };
}

/**
 * Cross-row check: replays each asset's trades in timestamp order and
 * catches any SELL that would exceed the held balance. Reuses the real
 * calculation engine so this check can never drift from the numbers the
 * dashboard actually shows.
 */
export function validateNoShortPositions(trades: Trade[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const bySymbol = new Map<string, Trade[]>();
  for (const t of trades) {
    const list = bySymbol.get(t.symbol) ?? [];
    list.push(t);
    bySymbol.set(t.symbol, list);
  }

  for (const [, symbolTrades] of bySymbol) {
    const sorted = [...symbolTrades].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    try {
      replayAssetTrades(sorted[0].symbol, sorted);
    } catch (err) {
      if (err instanceof ShortPositionError) {
        errors.push({
          row: -1,
          field: 'quantity',
          message: err.message,
        });
      } else {
        throw err;
      }
    }
  }

  return errors;
}

export function validateImport(
  header: string[],
  rows: RawCsvRow[],
): ValidationResult & { trades: Trade[] } {
  const columnErrors = validateColumns(header, REQUIRED_TRADE_COLUMNS);
  if (columnErrors.length > 0) {
    return { valid: false, errors: columnErrors, trades: [] };
  }

  const { trades, errors: rowErrors } = validateAndParseRows(rows);
  const shortErrors = rowErrors.length === 0 ? validateNoShortPositions(trades) : [];
  const errors = [...rowErrors, ...shortErrors];

  return { valid: errors.length === 0, errors, trades: errors.length === 0 ? trades : [] };
}

export function validatePricesImport(
  header: string[],
  rows: RawCsvRow[],
): ValidationResult & { prices: PriceSnapshot[] } {
  const columnErrors = validateColumns(header, REQUIRED_PRICE_COLUMNS);
  if (columnErrors.length > 0) {
    return { valid: false, errors: columnErrors, prices: [] };
  }

  const errors: ValidationError[] = [];
  const prices: PriceSnapshot[] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const rowErrors: ValidationError[] = [];

    const rawAsOf = row.as_of?.trim();
    if (!rawAsOf || !isValidUtcIso8601(rawAsOf)) {
      rowErrors.push({
        row: rowNum,
        field: 'as_of',
        message: `Invalid UTC ISO-8601 timestamp "${row.as_of}"`,
      });
    }

    const symbol = row.symbol?.trim() as Symbol;
    if (!VALID_SYMBOLS.includes(symbol)) {
      rowErrors.push({
        row: rowNum,
        field: 'symbol',
        message: `Unsupported symbol "${row.symbol}"`,
      });
    }

    let priceUsd: Decimal | undefined;
    try {
      if (!row.price_usd || row.price_usd.trim() === '') {
        rowErrors.push({ row: rowNum, field: 'price_usd', message: 'price_usd is required' });
      } else {
        priceUsd = new Decimal(row.price_usd.trim());
        if (!priceUsd.greaterThan(0)) {
          rowErrors.push({ row: rowNum, field: 'price_usd', message: 'price_usd must be greater than zero' });
        }
      }
    } catch {
      rowErrors.push({ row: rowNum, field: 'price_usd', message: `Invalid price_usd "${row.price_usd}"` });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    prices.push({
      asOf: new Date(rawAsOf!),
      symbol,
      priceUsd: priceUsd!,
    });
  });

  return { valid: errors.length === 0, errors, prices: errors.length === 0 ? prices : [] };
}
