import { useQuery } from '@tanstack/react-query';
import { fetchPortfolioSnapshot } from '../api';
import { PortfolioSnapshotDto } from '../types';

export const PORTFOLIO_QUERY_KEY = ['portfolio'];

export function usePortfolio() {
  const query = useQuery<PortfolioSnapshotDto, Error>({
    queryKey: PORTFOLIO_QUERY_KEY,
    queryFn: fetchPortfolioSnapshot,
  });

  // Reconcile headline value with sum of individual asset holdings
  let reconciled = true;
  let computedSum = 0;
  let summaryValue = 0;

  if (query.data?.positions && query.data?.summary) {
    computedSum = query.data.positions.reduce((acc, p) => acc + (parseFloat(p.currentValue) || 0), 0);
    summaryValue = parseFloat(query.data.summary.currentValue) || 0;
    // Allow small epsilon for floating display comparison (backend does full Decimal)
    reconciled = Math.abs(computedSum - summaryValue) < 0.05;
  }

  return {
    ...query,
    snapshot: query.data,
    summary: query.data?.summary,
    positions: query.data?.positions ?? [],
    reconciliation: {
      isReconciled: reconciled,
      computedSum,
      summaryValue,
      diff: Math.abs(computedSum - summaryValue),
    },
  };
}

