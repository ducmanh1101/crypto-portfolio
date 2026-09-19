import { AssetPosition } from '../lib/types';
import { formatUsd, formatSignedUsd, formatPct } from '../lib/format';

export function HoldingsTable({ positions }: { positions: AssetPosition[] }) {
  if (positions.length === 0) {
    return <div className="empty-state">No holdings yet — import trades.csv to get started.</div>;
  }

  return (
    <table className="holdings-table">
      <thead>
        <tr>
          <th>Asset</th>
          <th>Qty Held</th>
          <th>Avg Cost</th>
          <th>Current Price</th>
          <th>Cost Basis</th>
          <th>Current Value</th>
          <th>Realized P&L</th>
          <th>Unrealized P&L</th>
          <th>Total P&L</th>
          <th>Allocation</th>
        </tr>
      </thead>
      <tbody>
        {positions.map((p) => (
          <tr key={p.symbol} className={parseFloat(p.quantityHeld) === 0 ? 'closed-row' : ''}>
            <td>{p.symbol}</td>
            <td>{p.quantityHeld}</td>
            <td>{formatUsd(p.averageCost)}</td>
            <td>{formatUsd(p.currentPrice)}</td>
            <td>{formatUsd(p.currentCostBasis)}</td>
            <td>{formatUsd(p.currentValue)}</td>
            <td>{formatSignedUsd(p.realizedPnl)}</td>
            <td>{formatSignedUsd(p.unrealizedPnl)}</td>
            <td>{formatSignedUsd(p.totalPnl)}</td>
            <td>{formatPct(p.allocationPct)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
