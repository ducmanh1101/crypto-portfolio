// All rounding happens here, at the display boundary — the backend keeps
// full Decimal precision. See README "Precision and rounding decisions".

export function formatUsd(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

/** Same as formatUsd but always shows a leading +/- sign and a text tag for a11y. */
export function formatSignedUsd(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  const formatted = Math.abs(n).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
  return n >= 0 ? `+${formatted} (gain)` : `-${formatted} (loss)`;
}

export function formatPct(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return `${(n * 100).toFixed(1)}%`;
}
