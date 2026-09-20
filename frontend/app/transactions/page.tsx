'use client';

import React from 'react';
import { TransactionTable } from '../../components/TransactionTable';

export default function TransactionsPage() {
  return (
    <main className="space-y-6 animate-fade-in" aria-label="Transaction Explorer Page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Transaction Explorer
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Search, filter, sort, and paginate historical trades across exchanges and assets
        </p>
      </div>

      <TransactionTable />
    </main>
  );
}
