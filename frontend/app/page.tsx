import { fetchPortfolioSnapshot } from '../lib/api';
import { SummaryCards } from '../components/SummaryCards';
import { HoldingsTable } from '../components/HoldingsTable';
import { AllocationChart, PnlByAssetChart } from '../components/Charts';
import { ImportPanel } from '../components/ImportPanel';

export default async function DashboardPage() {
  // Server component: fetch fails (e.g. backend down, no data imported yet)
  // are caught here so the page still renders with an actionable empty/error
  // state instead of crashing.
  let snapshot;
  let loadError: string | null = null;
  try {
    snapshot = await fetchPortfolioSnapshot();
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Failed to load portfolio';
  }

  return (
    <main className="dashboard">
      <h1>Portfolio Dashboard</h1>
      <ImportPanel />

      {loadError && <div className="error-state">Couldn&apos;t load portfolio: {loadError}</div>}

      {snapshot && (
        <>
          <SummaryCards summary={snapshot.summary} />
          <div className="charts-row">
            <AllocationChart positions={snapshot.positions} />
            <PnlByAssetChart positions={snapshot.positions} />
          </div>
          <h2>Holdings</h2>
          <HoldingsTable positions={snapshot.positions} />
        </>
      )}
    </main>
  );
}
