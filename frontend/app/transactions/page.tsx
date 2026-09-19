import { TransactionTable } from '../../components/TransactionTable';

export default function TransactionsPage() {
  return (
    <main className="transactions-page">
      <h1>Transaction Explorer</h1>
      <TransactionTable />
    </main>
  );
}
