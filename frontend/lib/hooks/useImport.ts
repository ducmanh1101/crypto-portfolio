import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importPricesCsv, importTradesCsv, resetSampleData } from '../api';
import { PORTFOLIO_QUERY_KEY } from './usePortfolio';
import { TRADES_QUERY_KEY } from './useTrades';
import { PRICES_QUERY_KEY } from './usePrices';

export function useImportMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: [TRADES_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: PRICES_QUERY_KEY });
  };

  const importTradesMutation = useMutation({
    mutationFn: (file: File) => importTradesCsv(file),
    onSuccess: () => {
      invalidateAll();
    },
  });

  const importPricesMutation = useMutation({
    mutationFn: (file: File) => importPricesCsv(file),
    onSuccess: () => {
      invalidateAll();
    },
  });

  const resetDataMutation = useMutation({
    mutationFn: () => resetSampleData(),
    onSuccess: () => {
      invalidateAll();
    },
  });

  return {
    importTradesMutation,
    importPricesMutation,
    resetDataMutation,
  };
}

