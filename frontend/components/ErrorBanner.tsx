import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorBanner({
  title = 'Error Loading Portfolio Data',
  message,
  onRetry,
  isRetrying = false,
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 mb-6 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md shadow-lg shadow-rose-950/20"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-rose-200 text-sm tracking-wide">{title}</h3>
          <p className="text-sm text-rose-300/90 mt-0.5 font-normal leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-100 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none self-end sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying…' : 'Try Again'}</span>
        </button>
      )}
    </div>
  );
}

