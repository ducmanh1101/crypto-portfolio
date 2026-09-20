/**
 * Presentation Boundary Formatting Helpers
 * All rounding and locale representation happens here.
 * The backend retains full arbitrary-precision Decimal numbers.
 */

/**
 * Formats a number or numeric string as USD.
 * Intelligently adapts decimal places for sub-cent assets (e.g., CKB @ $0.00715).
 */
export function formatUsd(
  value: string | number | null | undefined,
  options?: { maxDecimals?: number; minDecimals?: number; autoSubCent?: boolean }
): string {
  if (value === null || value === undefined || value === '') return '$0.00';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '$0.00';

  const autoSubCent = options?.autoSubCent ?? true;
  let maxDecimals = options?.maxDecimals ?? 2;
  let minDecimals = options?.minDecimals ?? 2;

  if (autoSubCent && Math.abs(n) > 0 && Math.abs(n) < 0.01) {
    maxDecimals = Math.max(maxDecimals, 6);
    minDecimals = Math.max(minDecimals, 4);
  }

  // Guard against RangeError: maximumFractionDigits must be >= minimumFractionDigits
  minDecimals = Math.min(minDecimals, maxDecimals);

  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Formats USD with explicit leading +/- sign and accessibility text tag.
 * Guaranteed to satisfy financial accessibility (no color-only status).
 */
export function formatSignedUsd(
  value: string | number | null | undefined,
  options?: { maxDecimals?: number }
): string {
  if (value === null || value === undefined || value === '') return '$0.00';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '$0.00';

  if (Math.abs(n) < 0.0000001) {
    return '$0.00';
  }

  const maxDecimals = Math.max(2, options?.maxDecimals ?? 2);
  const minDecimals = Math.min(2, maxDecimals);

  const formatted = Math.abs(n).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });

  return n > 0 ? `+${formatted} (gain)` : `-${formatted} (loss)`;
}

/**
 * Formats a ratio (0.0 to 1.0) or pre-multiplied number into percentage string.
 */
export function formatPct(value: string | number | null | undefined, isFraction = true): string {
  if (value === null || value === undefined || value === '') return '0.0%';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '0.0%';

  const multiplied = isFraction ? n * 100 : n;
  return `${multiplied.toFixed(1)}%`;
}

/**
 * Formats a percentage with leading sign (+12.4% / -5.1%).
 */
export function formatSignedPct(value: string | number | null | undefined, isFraction = true): string {
  if (value === null || value === undefined || value === '') return '0.0%';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '0.0%';

  const multiplied = isFraction ? n * 100 : n;
  if (Math.abs(multiplied) < 0.05) return '0.0%';
  const sign = multiplied > 0 ? '+' : '';
  return `${sign}${multiplied.toFixed(1)}%`;
}

/**
 * Formats a crypto quantity with appropriate precision, trimming excess zeros.
 */
export function formatCryptoQty(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '0';

  if (Math.abs(n) >= 1000) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: 8 });
}

/**
 * Formats a UTC timestamp into a readable localized date-time string.
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Invalid date';

    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return String(isoString);
  }
}

/**
 * Human-readable relative time (e.g., "5m ago", "2h ago").
 */
export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';

  const now = Date.now();
  const diffSec = Math.floor((now - d.getTime()) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}
