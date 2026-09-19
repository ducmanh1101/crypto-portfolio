# TODO — Frontend: Crypto Portfolio Analytics

## Context
Build the frontend for the Senior Full-Stack Engineer assessment: a crypto portfolio analytics dashboard using supplied trade/price data only. The UI must reconcile with backend calculation results and clearly expose loading, empty, validation, and error states.

## Stack / architecture
- [ ] Use the existing project stack unless there is a strong reason to change it.
- [ ] Keep presentation logic separate from deterministic portfolio calculations.
- [ ] Define explicit TypeScript contracts for API responses and UI models.
- [ ] Keep frontend/backend boundary clear.
- [ ] Build responsive, accessible UI for common desktop/mobile sizes.
- [ ] Do not add authentication, blockchain integration, live trading, or live market data unless essential.

## 1. App shell & data flow
- [ ] Create dashboard page/layout.
- [ ] Add clear loading state for initial portfolio load.
- [ ] Add global/API error state for unexpected failures.
- [ ] Add empty state for zero holdings / no portfolio data.
- [ ] Display the price snapshot `as_of` timestamp so users know when valuation occurred.
- [ ] Ensure all headline values and charts reconcile with holdings data returned by backend.

## 2. Dashboard KPI cards
Display:
- [ ] Current portfolio value
- [ ] Current cost basis
- [ ] Realized P&L
- [ ] Unrealized P&L
- [ ] Total P&L
- [ ] Total fees paid

Formatting:
- [ ] Consistent USD currency formatting.
- [ ] Consistent sign formatting for positive/negative values.
- [ ] Percentage formatting where applicable.
- [ ] Do not rely on color alone to distinguish positive vs negative performance; include signs/icons/text where useful.

## 3. Holdings table
One row per asset:
- [ ] Symbol
- [ ] Quantity held
- [ ] Weighted-average cost
- [ ] Current price
- [ ] Current cost basis
- [ ] Current value
- [ ] Realized P&L
- [ ] Unrealized P&L
- [ ] Total P&L
- [ ] Portfolio allocation

Additional:
- [ ] Keep closed assets visible when realized P&L is non-zero.
- [ ] Handle zero holdings cleanly.
- [ ] Handle missing current prices visibly.
- [ ] Make the table responsive/readable on mobile.

## 4. Charts
Implement at least:
- [ ] Portfolio allocation by current value.
- [ ] Realized vs unrealized P&L by asset.
- [ ] Handle zero values clearly.
- [ ] Handle negative P&L clearly.
- [ ] Verify chart totals reconcile with holdings table.

## 5. Transaction Explorer
Display all fields from `trades.csv`:
- [ ] trade_id
- [ ] timestamp
- [ ] exchange
- [ ] symbol
- [ ] side
- [ ] quantity
- [ ] price_usd
- [ ] fee_usd

Also:
- [ ] Display gross trade value.
- [ ] Make fees visible.
- [ ] Search/filter by asset.
- [ ] Filter by exchange.
- [ ] Filter by BUY/SELL.
- [ ] Filter by date range.
- [ ] Sort by timestamp.
- [ ] Add pagination or virtualization for practical browsing.
- [ ] Handle empty filter results.

## 6. Import / re-import UI
- [ ] Provide a way to import/re-import `trades.csv`.
- [ ] Show upload/import progress or loading state.
- [ ] Show clear, actionable validation errors.
- [ ] Never display a partially imported dataset as successful.
- [ ] Allow user to reset/load sample data according to README instructions.

## 7. Error / edge states
Explicitly handle:
- [ ] First load
- [ ] Missing prices
- [ ] Zero holdings
- [ ] Invalid CSV
- [ ] Duplicate trade IDs
- [ ] Invalid timestamps
- [ ] Unsupported exchange/symbol/side
- [ ] Non-positive quantity/price
- [ ] Negative fee
- [ ] SELL that exceeds available quantity
- [ ] Unexpected calculation/import failure

## 8. Accessibility & UX
- [ ] Keyboard-accessible controls.
- [ ] Labels for filters/upload controls.
- [ ] Meaningful table headers.
- [ ] Good empty/error messages.
- [ ] Do not communicate financial status using color alone.
- [ ] Responsive layout.

## 9. Frontend tests
- [ ] Test key dashboard rendering states.
- [ ] Test holdings table with positive, negative, zero, and closed-asset values.
- [ ] Test transaction filters/sorting.
- [ ] Test import validation error display.
- [ ] Test missing-price state.
- [ ] Test API/calculation error state.

## 10. Definition of Done
- [ ] Dashboard shows all required metrics.
- [ ] Holdings table contains all required columns.
- [ ] Both required chart types are present and reconcile with data.
- [ ] Transaction explorer supports all required filters/sorting/browsing.
- [ ] Import/re-import and validation errors are usable.
- [ ] Loading/empty/error states are implemented.
- [ ] Responsive/accessibility requirements are met.
- [ ] Frontend tests pass.
