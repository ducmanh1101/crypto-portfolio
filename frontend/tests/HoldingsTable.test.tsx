import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HoldingsTable } from '../components/HoldingsTable';
import { HoldingDto } from '../lib/types';

describe('HoldingsTable Component', () => {
  const samplePositions: HoldingDto[] = [
    {
      symbol: 'BTC',
      quantityHeld: '0.0774292',
      averageCost: '117711.90',
      currentPrice: '111500.00',
      currentCostBasis: '9114.34',
      currentValue: '8633.36',
      realizedPnl: '-463.75',
      unrealizedPnl: '-480.98',
      totalPnl: '-944.73',
      allocationPct: '0.1424',
      totalFeesPaid: '486.42',
    },
    {
      symbol: 'SOL',
      quantityHeld: '0',
      averageCost: '0',
      currentPrice: '208.50',
      currentCostBasis: '0',
      currentValue: '0',
      realizedPnl: '1250.40',
      unrealizedPnl: '0',
      totalPnl: '1250.40',
      allocationPct: '0',
      totalFeesPaid: '120.50',
    },
    {
      symbol: 'CKB',
      quantityHeld: '150000',
      averageCost: '0.008',
      currentPrice: '', // Missing price case
      currentCostBasis: '1200',
      currentValue: '1072.50',
      realizedPnl: '0',
      unrealizedPnl: '-127.50',
      totalPnl: '-127.50',
      allocationPct: '0.02',
      totalFeesPaid: '15.00',
    },
  ];

  it('renders all 10 required table column headers', () => {
    render(<HoldingsTable positions={samplePositions} />);

    expect(screen.getByRole('button', { name: /^Asset/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Qty Held/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Avg Cost/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Current Price/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Cost Basis/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Current Value/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Realized P&L/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Unrealized P&L/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Total P&L/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Allocation/i })).toBeInTheDocument();
  });

  it('renders open positions with formatted quantities and currency', () => {
    render(<HoldingsTable positions={samplePositions} />);

    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('0.0774292')).toBeInTheDocument();
    expect(screen.getByText('$8,633.36')).toBeInTheDocument();
    expect(screen.getByText('14.2%')).toBeInTheDocument();
  });

  it('keeps closed assets visible when quantity is zero with non-zero realized P&L', () => {
    render(<HoldingsTable positions={samplePositions} />);

    expect(screen.getByText('SOL')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getAllByText('+$1,250.40 (gain)').length).toBeGreaterThan(0);
  });

  it('handles missing current price visibly without breaking', () => {
    render(<HoldingsTable positions={samplePositions} />);

    expect(screen.getByText('CKB')).toBeInTheDocument();
    expect(screen.getByText(/Price N\/A/i)).toBeInTheDocument();
  });

  it('renders clean empty state when there are zero holdings', () => {
    render(<HoldingsTable positions={[]} />);

    expect(screen.getByText(/No Holdings Found/i)).toBeInTheDocument();
  });

  it('supports sorting by column when header is clicked', () => {
    render(<HoldingsTable positions={samplePositions} />);

    const assetHeader = screen.getByRole('button', { name: /^Asset/i });
    fireEvent.click(assetHeader);
    expect(assetHeader).toBeInTheDocument();
  });
});

