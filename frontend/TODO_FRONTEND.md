# TODO — Frontend: Crypto Portfolio Analytics

## Context
Build the frontend for the Senior Full-Stack Engineer assessment: a crypto portfolio analytics dashboard using supplied trade/price data only. The UI must reconcile with backend calculation results and clearly expose loading, empty, validation, and error states.

## Stack / architecture
- [x] Use the existing project stack unless there is a strong reason to change it.
- [x] Keep presentation logic separate from deterministic portfolio calculations.
- [x] Define explicit TypeScript contracts for API responses and UI models.
- [x] Keep frontend/backend boundary clear.
- [x] Build responsive, accessible UI for common desktop/mobile sizes.
- [x] Do not add authentication, blockchain integration, live trading, or live market data unless essential.

## 1. App shell & data flow
- [x] Create dashboard page/layout.
- [x] Add clear loading state for initial portfolio load.
- [x] Add global/API error state for unexpected failures.
- [x] Add empty state for zero holdings / no portfolio data.
- [x] Display the price snapshot `as_of` timestamp so users know when valuation occurred.
- [x] Ensure all headline values and charts reconcile with holdings data returned by backend.

## 2. Dashboard KPI cards
Display:
- [x] Current portfolio value
- [x] Current cost basis
- [x] Realized P&L
- [x] Unrealized P&L
- [x] Total P&L
- [x] Total fees paid

Formatting:
- [x] Consistent USD currency formatting.
- [x] Consistent sign formatting for positive/negative values.
- [x] Percentage formatting where applicable.
- [x] Do not rely on color alone to distinguish positive vs negative performance; include signs/icons/text where useful.

## 3. Holdings table
One row per asset:
- [x] Symbol
- [x] Quantity held
- [x] Weighted-average cost
- [x] Current price
- [x] Current cost basis
- [x] Current value
- [x] Realized P&L
- [x] Unrealized P&L
- [x] Total P&L
- [x] Portfolio allocation

Additional:
- [x] Keep closed assets visible when realized P&L is non-zero.
- [x] Handle zero holdings cleanly.
- [x] Handle missing current prices visibly.
- [x] Make the table responsive/readable on mobile.

## 4. Charts
Implement at least:
- [x] Portfolio allocation by current value.
- [x] Realized vs unrealized P&L by asset.
- [x] Handle zero values clearly.
- [x] Handle negative P&L clearly.
- [x] Verify chart totals reconcile with holdings table.

## 5. Transaction Explorer
Display all fields from `trades.csv`:
- [x] trade_id
- [x] timestamp
- [x] exchange
- [x] symbol
- [x] side
- [x] quantity
- [x] price_usd
- [x] fee_usd

Also:
- [x] Display gross trade value.
- [x] Make fees visible.
- [x] Search/filter by asset.
- [x] Filter by exchange.
- [x] Filter by BUY/SELL.
- [x] Filter by date range.
- [x] Sort by timestamp.
- [x] Add pagination or virtualization for practical browsing.
- [x] Handle empty filter results.

## 6. Import / re-import UI
- [x] Provide a way to import/re-import `trades.csv`.
- [x] Show upload/import progress or loading state.
- [x] Show clear, actionable validation errors.
- [x] Never display a partially imported dataset as successful.
- [x] Allow user to reset/load sample data according to README instructions.

## 7. Error / edge states
Explicitly handle:
- [x] First load
- [x] Missing prices
- [x] Zero holdings
- [x] Invalid CSV
- [x] Duplicate trade IDs
- [x] Invalid timestamps
- [x] Unsupported exchange/symbol/side
- [x] Non-positive quantity/price
- [x] Negative fee
- [x] SELL that exceeds available quantity
- [x] Unexpected calculation/import failure

## 8. Accessibility & UX
- [x] Keyboard-accessible controls.
- [x] Labels for filters/upload controls.
- [x] Meaningful table headers.
- [x] Good empty/error messages.
- [x] Do not communicate financial status using color alone.
- [x] Responsive layout.

## 9. Frontend tests
- [x] Test key dashboard rendering states.
- [x] Test holdings table with positive, negative, zero, and closed-asset values.
- [x] Test transaction filters/sorting.
- [x] Test import validation error display.
- [x] Test missing-price state.
- [x] Test API/calculation error state.

## 10. Definition of Done
- [x] Dashboard shows all required metrics.
- [x] Holdings table contains all required columns.
- [x] Both required chart types are present and reconcile with data.
- [x] Transaction explorer supports all required filters/sorting/browsing.
- [x] Import/re-import and validation errors are usable.
- [x] Loading/empty/error states are implemented.
- [x] Responsive/accessibility requirements are met.
- [x] Frontend tests pass.
