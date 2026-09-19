'use client';

import { AssetPosition } from '../lib/types';

// NOTE: this is a minimal dependency-free scaffold (plain SVG) so the
// project runs without extra installs. Swap in Recharts/Chart.js for the
// final submission if you want richer interactivity (tooltips, legends).

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7'];

export function AllocationChart({ positions }: { positions: AssetPosition[] }) {
  const held = positions.filter((p) => parseFloat(p.currentValue) > 0);
  const total = held.reduce((sum, p) => sum + parseFloat(p.currentValue), 0);

  if (total === 0) return <div className="empty-state">No current holdings to chart.</div>;

  let cumulative = 0;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="chart allocation-chart">
      <h3>Allocation by Current Value</h3>
      <svg viewBox="0 0 200 200" width={200} height={200}>
        <g transform="translate(100,100) rotate(-90)">
          {held.map((p, i) => {
            const value = parseFloat(p.currentValue);
            const fraction = value / total;
            const dash = fraction * circumference;
            const el = (
              <circle
                key={p.symbol}
                r={radius}
                fill="transparent"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={32}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-cumulative}
              />
            );
            cumulative += dash;
            return el;
          })}
        </g>
      </svg>
      <ul className="legend">
        {held.map((p, i) => (
          <li key={p.symbol}>
            <span className="swatch" style={{ background: COLORS[i % COLORS.length] }} />
            {p.symbol} — {((parseFloat(p.currentValue) / total) * 100).toFixed(1)}%
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PnlByAssetChart({ positions }: { positions: AssetPosition[] }) {
  if (positions.length === 0) return <div className="empty-state">No P&L to chart yet.</div>;

  const maxAbs = Math.max(
    1,
    ...positions.map((p) => Math.max(Math.abs(parseFloat(p.realizedPnl)), Math.abs(parseFloat(p.unrealizedPnl)))),
  );
  const barMax = 100; // px, from center

  return (
    <div className="chart pnl-chart">
      <h3>Realized &amp; Unrealized P&amp;L by Asset</h3>
      <div className="pnl-bars">
        {positions.map((p) => {
          const realized = parseFloat(p.realizedPnl);
          const unrealized = parseFloat(p.unrealizedPnl);
          return (
            <div key={p.symbol} className="pnl-row">
              <span className="pnl-symbol">{p.symbol}</span>
              <div className="pnl-bar-track">
                <div
                  className={`pnl-bar realized ${realized >= 0 ? 'positive' : 'negative'}`}
                  style={{ width: `${(Math.abs(realized) / maxAbs) * barMax}px` }}
                  title={`Realized: ${realized.toFixed(2)}`}
                />
              </div>
              <div className="pnl-bar-track">
                <div
                  className={`pnl-bar unrealized ${unrealized >= 0 ? 'positive' : 'negative'}`}
                  style={{ width: `${(Math.abs(unrealized) / maxAbs) * barMax}px` }}
                  title={`Unrealized: ${unrealized.toFixed(2)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="legend-inline">
        <span className="dot realized" /> Realized &nbsp; <span className="dot unrealized" /> Unrealized
      </div>
    </div>
  );
}
