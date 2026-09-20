import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ImportModal } from '../components/ImportModal';
import * as useImportHook from '../lib/hooks/useImport';

vi.mock('../lib/hooks/useImport');

describe('ImportModal Component', () => {
  const mockMutations = {
    importTradesMutation: { isPending: false, mutateAsync: vi.fn() },
    importPricesMutation: { isPending: false, mutateAsync: vi.fn() },
    resetDataMutation: { isPending: false, mutateAsync: vi.fn() },
  };

  it('renders modal when isOpen is true', () => {
    vi.spyOn(useImportHook, 'useImportMutations').mockReturnValue(mockMutations as any);

    render(<ImportModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Import \/ Re-import Dataset/i)).toBeInTheDocument();
    expect(screen.getByText(/Trades History \(trades.csv\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Market Prices \(prices.csv\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Reset to Sample Data/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    vi.spyOn(useImportHook, 'useImportMutations').mockReturnValue(mockMutations as any);

    const { container } = render(<ImportModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays atomic rollback safety notice', () => {
    vi.spyOn(useImportHook, 'useImportMutations').mockReturnValue(mockMutations as any);

    render(<ImportModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Zero Partial State:/i)).toBeInTheDocument();
  });
});

