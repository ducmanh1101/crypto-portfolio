import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopNav } from '../components/TopNav';
import { ThemeProvider } from '../components/ThemeProvider';
import * as usePricesHook from '../lib/hooks/usePrices';
import * as useImportHook from '../lib/hooks/useImport';

vi.mock('../lib/hooks/usePrices');
vi.mock('../lib/hooks/useImport');
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('TopNav Component', () => {
  it('renders reactive prices ticker feed from usePrices hook', () => {
    vi.spyOn(usePricesHook, 'usePrices').mockReturnValue({
      data: {
        asOf: '2026-09-20T00:00:00.000Z',
        prices: [
          { symbol: 'BTC', priceUsd: '64000.00', asOf: '2026-09-20T00:00:00.000Z' },
          { symbol: 'ETH', priceUsd: '3500.00', asOf: '2026-09-20T00:00:00.000Z' },
        ],
      },
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(useImportHook, 'useImportMutations').mockReturnValue({
      importTradesMutation: { isPending: false },
      importPricesMutation: { isPending: false },
      resetDataMutation: { isPending: false },
    } as any);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TopNav />
        </ThemeProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Snapshot Feed')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('$64,000.00')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('$3,500.00')).toBeInTheDocument();
  });
});

