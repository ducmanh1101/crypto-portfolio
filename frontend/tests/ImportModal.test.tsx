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

  it('calls onClose when Escape key is pressed', () => {
    const onCloseMock = vi.fn();
    vi.spyOn(useImportHook, 'useImportMutations').mockReturnValue(mockMutations as any);

    render(<ImportModal isOpen={true} onClose={onCloseMock} />);
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('renders validation error table when API rejects import', async () => {
    const errorWithDetails = {
      message: 'Import failed validation',
      errors: [
        { row: 4, field: 'trade_id', message: 'trade_id is required' },
        { row: 13, field: 'trade_id', message: 'Duplicate trade_id "TRD-INV1-0012"' },
        { row: -1, field: 'quantity', message: 'Trade TRD-INV2-0001: SELL 0.5 BTC exceeds available balance 0' },
      ],
    };

    const failingMutations = {
      ...mockMutations,
      importTradesMutation: {
        isPending: false,
        mutateAsync: vi.fn().mockRejectedValue(errorWithDetails),
      },
    };
    vi.spyOn(useImportHook, 'useImportMutations').mockReturnValue(failingMutations as any);

    const { container } = render(<ImportModal isOpen={true} onClose={vi.fn()} />);

    // Select file and submit
    const file = new File(['dummy,content'], 'trades_invalid_1.csv', { type: 'text/csv' });
    const input = container.querySelector('#csv-file-input')!;
    
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Validate & Import/i }));

    // Wait for validation errors to be displayed
    expect(await screen.findByText(/3 Validation Errors Encountered/i)).toBeInTheDocument();
    expect(screen.getByText(/trade_id is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Duplicate trade_id "TRD-INV1-0012"/i)).toBeInTheDocument();
    expect(screen.getByText(/Trade TRD-INV2-0001: SELL 0.5 BTC exceeds available balance 0/i)).toBeInTheDocument();
    expect(screen.getByText(/Row 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Row 13/i)).toBeInTheDocument();
  });

  it('renders success status message on valid file import', async () => {
    const successMutations = {
      ...mockMutations,
      importTradesMutation: {
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue({ imported: 125 }),
      },
    };
    vi.spyOn(useImportHook, 'useImportMutations').mockReturnValue(successMutations as any);

    render(<ImportModal isOpen={true} onClose={vi.fn()} />);

    const file = new File(['dummy,content'], 'trades_valid_1.csv', { type: 'text/csv' });
    const input = document.getElementById('csv-file-input');

    fireEvent.change(input!, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /Validate & Import/i }));

    expect(await screen.findByText(/Atomic import successful! 125 trades reloaded into portfolio./i)).toBeInTheDocument();
  });
});

