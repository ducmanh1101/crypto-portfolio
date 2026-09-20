import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionTable } from '../components/TransactionTable';
import * as useTradesHook from '../lib/hooks/useTrades';

vi.mock('../lib/hooks/useTrades');

describe('TransactionTable Component', () => {
  const mockTradesResponse = {
    items: [
      {
        tradeId: 'TRD-0001',
        timestamp: '2025-10-01T09:00:00.000Z',
        exchange: 'Binance',
        symbol: 'BTC',
        side: 'BUY' as const,
        quantity: '0.03141403',
        priceUsd: '105507.74',
        feeUsd: '3.31',
        grossValueUsd: '3314.42',
      },
      {
        tradeId: 'TRD-0002',
        timestamp: '2025-10-02T02:00:00.000Z',
        exchange: 'Coinbase',
        symbol: 'ETH',
        side: 'SELL' as const,
        quantity: '0.500000',
        priceUsd: '3600.00',
        feeUsd: '5.00',
        grossValueUsd: '1800.00',
      },
    ],
    total: 2,
    page: 1,
    pageSize: 25,
  };

  it('renders all required trade fields from trades.csv', () => {
    vi.spyOn(useTradesHook, 'useTrades').mockReturnValue({
      data: mockTradesResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(<TransactionTable />);

    // Check headers
    expect(screen.getByText('Trade ID')).toBeInTheDocument();
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    expect(screen.getByText('Exchange')).toBeInTheDocument();
    expect(screen.getByText('Symbol')).toBeInTheDocument();
    expect(screen.getByText('Side')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('Execution Price')).toBeInTheDocument();
    expect(screen.getByText('Fee')).toBeInTheDocument();
    expect(screen.getByText('Gross Value')).toBeInTheDocument();

    // Check row data
    expect(screen.getByText('TRD-0001')).toBeInTheDocument();
    expect(screen.getAllByText('Binance').length).toBeGreaterThan(0);
    expect(screen.getAllByText('BUY').length).toBeGreaterThan(0);
    expect(screen.getByText('$105,507.74')).toBeInTheDocument();
    expect(screen.getByText('$3.31')).toBeInTheDocument();
    expect(screen.getByText('$3,314.42')).toBeInTheDocument();
  });

  it('renders filter dropdowns for Asset, Exchange, and Side', () => {
    vi.spyOn(useTradesHook, 'useTrades').mockReturnValue({
      data: mockTradesResponse,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(<TransactionTable />);

    expect(screen.getByText('All Assets')).toBeInTheDocument();
    expect(screen.getByText('All Exchanges')).toBeInTheDocument();
    expect(screen.getByText('All Sides (BUY / SELL)')).toBeInTheDocument();
  });

  it('renders empty state when no transactions match filters', () => {
    vi.spyOn(useTradesHook, 'useTrades').mockReturnValue({
      data: { items: [], total: 0, page: 1, pageSize: 25 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(<TransactionTable />);

    expect(screen.getByText(/No transactions match your criteria/i)).toBeInTheDocument();
  });

  it('renders gracefully when trades have missing/null fields without throwing runtime errors', () => {
    vi.spyOn(useTradesHook, 'useTrades').mockReturnValue({
      data: {
        items: [
          {
            tradeId: 'TRD-NULL-1',
            timestamp: 'invalid-iso-date',
            exchange: undefined as any,
            symbol: undefined as any,
            side: undefined as any,
            quantity: '1',
            priceUsd: '100',
            feeUsd: '0',
            grossValueUsd: '100',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 25,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    expect(() => render(<TransactionTable />)).not.toThrow();
    expect(screen.getByText('TRD-NULL-1')).toBeInTheDocument();
  });

  it('renders error banner when query encounters an API failure', () => {
    vi.spyOn(useTradesHook, 'useTrades').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch transactions from server'),
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(<TransactionTable />);
    expect(screen.getByText(/Failed to fetch transactions from server/i)).toBeInTheDocument();
  });
});

