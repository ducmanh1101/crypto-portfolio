import { PortfolioSummary } from '../lib/types';
import { formatUsd, formatSignedUsd } from '../lib/format';

/**
 * Six headline numbers required by the spec. Positive/negative values use
 * both a sign (+/-) AND a text label (not color alone), per the
 * "distinguish without relying on color alone" accessibility requirement.
 */
export function SummaryCards({ summary }: { summary: PortfolioSummary }) {
  const cards = [
    { label: 'Current Value', value: formatUsd(summary.currentValue) },
    { label: 'Current Cost Basis', value: formatUsd(summary.currentCostBasis) },
    { label: 'Realized P&L', value: formatSignedUsd(summary.realizedPnl) },
    { label: 'Unrealized P&L', value: formatSignedUsd(summary.unrealizedPnl) },
    { label: 'Total P&L', value: formatSignedUsd(summary.totalPnl) },
    { label: 'Total Fees Paid', value: formatUsd(summary.totalFeesPaid) },
  ];

  return (
    <div className="summary-grid">
      {cards.map((c) => (
        <div key={c.label} className="summary-card">
          <div className="summary-label">{c.label}</div>
          <div className="summary-value">{c.value}</div>
        </div>
      ))}
      {summary.pricesAsOf && (
        <div className="prices-as-of">Prices as of {new Date(summary.pricesAsOf).toLocaleString()}</div>
      )}
    </div>
  );
}
