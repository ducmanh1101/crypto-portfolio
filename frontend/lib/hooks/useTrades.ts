import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchTrades } from '../api';
import { PaginatedTransactionsDto, TradesQueryDto } from '../types';

export const TRADES_QUERY_KEY = 'trades';

export function useTrades(query: TradesQueryDto) {
  return useQuery<PaginatedTransactionsDto, Error>({
    queryKey: [TRADES_QUERY_KEY, query],
    queryFn: () => fetchTrades(query),
    placeholderData: keepPreviousData,
  });
}

