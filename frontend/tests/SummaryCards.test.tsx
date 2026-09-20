import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SummaryCards } from '../components/SummaryCards';
import { PortfolioSummaryDto } from '../lib/types';

describe('SummaryCards Component', () => {
  const sampleSummary: PortfolioSummaryDto = {
    currentValue: '60620.89',
    currentCostBasis: '59969.24',
    realizedPnl: '-5052.96',
    unrealizedPnl: '651.65',
    totalPnl: '-4401.31',
    totalFeesPaid: '2708.86',
    pricesAsOf: '2026-03-31T23:59:59.000Z',
  };

  it('renders all 6 headline KPI cards required by specification', () => {
    render(<SummaryCards summary={sampleSummary} />);

    expect(screen.getByText(/Portfolio Value/i)).toBeInTheDocument();
    expect(screen.getByText(/Cost Basis/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Realized P&L/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Unrealized P&L/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/^Total P&L/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Fees/i)).toBeInTheDocument();
  });

  it('formats USD values accurately', () => {
    render(<SummaryCards summary={sampleSummary} />);

    expect(screen.getByText('$60,620.89')).toBeInTheDocument();
    expect(screen.getByText('$59,969.24')).toBeInTheDocument();
    expect(screen.getByText('$2,708.86')).toBeInTheDocument();
  });

  it('does not rely on color alone for financial performance', () => {
    render(<SummaryCards summary={sampleSummary} />);

    // Negative realized P&L includes explicit - sign and loss badge/label
    expect(screen.getAllByText('-$5,052.96 (loss)').length).toBeGreaterThan(0);
    expect(screen.getByText('Loss (Closed)')).toBeInTheDocument();

    // Positive unrealized P&L includes explicit + sign and open gain badge
    expect(screen.getAllByText('+$651.65 (gain)').length).toBeGreaterThan(0);
    expect(screen.getByText('Open Gain')).toBeInTheDocument();

    // Negative total P&L includes - sign and net loss badge
    expect(screen.getByText('-$4,401.31 (loss)')).toBeInTheDocument();
    expect(screen.getByText('Net Loss')).toBeInTheDocument();
  });

  it('renders pricesAsOf timestamp', () => {
    render(<SummaryCards summary={sampleSummary} />);

    expect(screen.getByText(/Prices snapshot:/i)).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('displays reconciliation badge when reconciled', () => {
    render(
      <SummaryCards
        summary={sampleSummary}
        reconciliation={{
          isReconciled: true,
          computedSum: 60620.89,
          summaryValue: 60620.89,
          diff: 0,
        }}
      />
    );

    expect(screen.getByText(/Reconciled with Holdings Table/i)).toBeInTheDocument();
  });
});
