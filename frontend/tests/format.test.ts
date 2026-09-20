import { describe, it, expect } from 'vitest';
import {
  formatUsd,
  formatSignedUsd,
  formatPct,
  formatSignedPct,
  formatCryptoQty,
  formatDateTime,
} from '../lib/format';

describe('format helpers', () => {
  describe('formatUsd', () => {
    it('formats standard numbers into USD currency', () => {
      expect(formatUsd('105507.74')).toBe('$105,507.74');
      expect(formatUsd(1234.5)).toBe('$1,234.50');
      expect(formatUsd(0)).toBe('$0.00');
    });

    it('formats sub-cent crypto prices with higher precision', () => {
      expect(formatUsd('0.00715')).toBe('$0.00715');
      expect(formatUsd(0.000123)).toBe('$0.000123');
    });

    it('handles null, undefined, empty string gracefully', () => {
      expect(formatUsd(null)).toBe('$0.00');
      expect(formatUsd(undefined)).toBe('$0.00');
      expect(formatUsd('')).toBe('$0.00');
      expect(formatUsd('invalid')).toBe('$0.00');
    });
  });

  describe('formatSignedUsd', () => {
    it('includes leading + and (gain) text for positive values', () => {
      expect(formatSignedUsd('1234.56')).toBe('+$1,234.56 (gain)');
      expect(formatSignedUsd(50)).toBe('+$50.00 (gain)');
    });

    it('includes leading - and (loss) text for negative values', () => {
      expect(formatSignedUsd('-5052.96')).toBe('-$5,052.96 (loss)');
      expect(formatSignedUsd(-100)).toBe('-$100.00 (loss)');
    });

    it('formats zero as clean $0.00 without gain or loss tag', () => {
      expect(formatSignedUsd(0)).toBe('$0.00');
      expect(formatSignedUsd('0.0000000')).toBe('$0.00');
    });

    it('handles null and undefined', () => {
      expect(formatSignedUsd(null)).toBe('$0.00');
      expect(formatSignedUsd(undefined)).toBe('$0.00');
    });
  });

  describe('formatPct', () => {
    it('converts fractions into formatted percentages', () => {
      expect(formatPct('0.1424')).toBe('14.2%');
      expect(formatPct(0.5)).toBe('50.0%');
      expect(formatPct(1.0)).toBe('100.0%');
      expect(formatPct(0)).toBe('0.0%');
    });

    it('handles pre-multiplied numbers when isFraction is false', () => {
      expect(formatPct(15.5, false)).toBe('15.5%');
    });
  });

  describe('formatSignedPct', () => {
    it('adds leading + for positive returns', () => {
      expect(formatSignedPct(0.124)).toBe('+12.4%');
    });

    it('adds leading - for negative returns', () => {
      expect(formatSignedPct(-0.082)).toBe('-8.2%');
    });

    it('handles zero cleanly', () => {
      expect(formatSignedPct(0)).toBe('0.0%');
    });
  });

  describe('formatCryptoQty', () => {
    it('formats quantities without unnecessary noise', () => {
      expect(formatCryptoQty('0.0774292')).toBe('0.0774292');
      expect(formatCryptoQty('16367.54')).toBe('16,367.54');
      expect(formatCryptoQty('0')).toBe('0');
      expect(formatCryptoQty(null)).toBe('0');
    });
  });

  describe('formatDateTime', () => {
    it('formats valid ISO timestamps', () => {
      const formatted = formatDateTime('2026-03-31T23:59:59.000Z');
      expect(formatted).toContain('2026');
    });

    it('handles null, undefined, or invalid dates', () => {
      expect(formatDateTime(null)).toBe('N/A');
      expect(formatDateTime('invalid-date')).toBe('Invalid date');
    });
  });
});

