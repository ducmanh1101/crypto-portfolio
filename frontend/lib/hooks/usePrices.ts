import { useQuery } from '@tanstack/react-query';
import { fetchPrices } from '../api';
import { PricesResponseDto } from '../types';

export const PRICES_QUERY_KEY = ['prices'];

export function usePrices() {
  return useQuery<PricesResponseDto, Error>({
    queryKey: PRICES_QUERY_KEY,
    queryFn: fetchPrices,
  });
}

