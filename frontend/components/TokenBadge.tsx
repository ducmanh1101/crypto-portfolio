import React from 'react';

interface TokenBadgeProps {
  symbol: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const TOKEN_METADATA: Record<
  string,
  { name: string; color: string; bg: string; border: string; text: string }
> = {
  BTC: {
    name: 'Bitcoin',
    color: '#F7931A',
    bg: 'rgba(247, 147, 26, 0.15)',
    border: 'rgba(247, 147, 26, 0.35)',
    text: '#F7931A',
  },
  ETH: {
    name: 'Ethereum',
    color: '#627EEA',
    bg: 'rgba(98, 126, 234, 0.15)',
    border: 'rgba(98, 126, 234, 0.35)',
    text: '#818CF8',
  },
  SOL: {
    name: 'Solana',
    color: '#14F195',
    bg: 'rgba(20, 241, 149, 0.15)',
    border: 'rgba(20, 241, 149, 0.35)',
    text: '#34D399',
  },
  CKB: {
    name: 'Nervos Network',
    color: '#00CC9B',
    bg: 'rgba(0, 204, 155, 0.15)',
    border: 'rgba(0, 204, 155, 0.35)',
    text: '#2DD4BF',
  },
  DOGE: {
    name: 'Dogecoin',
    color: '#C2A633',
    bg: 'rgba(194, 166, 51, 0.15)',
    border: 'rgba(194, 166, 51, 0.35)',
    text: '#FBBF24',
  },
};

export function TokenBadge({ symbol, showName = false, size = 'md' }: TokenBadgeProps) {
  const safeSymbol = (symbol ?? '').trim().toUpperCase();
  const meta = TOKEN_METADATA[safeSymbol] ?? {
    name: symbol || 'UNKNOWN',
    color: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.3)',
    text: '#E2E8F0',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  return (
    <div
      className={`inline-flex items-center rounded-lg font-mono font-semibold transition-all duration-150 ${sizeClasses[size]}`}
      style={{
        backgroundColor: meta.bg,
        border: `1px solid ${meta.border}`,
        color: meta.text,
      }}
    >
      <span
        className="inline-block rounded-full flex-shrink-0"
        style={{
          width: size === 'sm' ? 6 : size === 'md' ? 8 : 10,
          height: size === 'sm' ? 6 : size === 'md' ? 8 : 10,
          backgroundColor: meta.color,
          boxShadow: `0 0 8px ${meta.color}`,
        }}
        aria-hidden="true"
      />
      <span>{symbol}</span>
      {showName && <span className="font-sans text-xs opacity-75 font-normal ml-1">({meta.name})</span>}
    </div>
  );
}

