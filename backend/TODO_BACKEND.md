# TODO — Backend: Crypto Portfolio Analytics

## Context
Build the backend/data layer for the Senior Full-Stack Engineer assessment. The supplied `trades.csv` and `prices.csv` are the only source of truth. Do NOT call live exchange or market-price APIs.

## Core data
`trades.csv` fields:
- `trade_id`
- `timestamp` — UTC ISO-8601
- `exchange` — Binance | Coinbase
- `symbol` — BTC | ETH | SOL | CKB | DOGE
- `side` — BUY | SELL
- `quantity`
- `price_usd`
- `fee_usd`

`prices.csv` fields:
- `as_of`
- `symbol`
- `price_usd`

## 1. Data contracts
- [x] Define explicit TypeScript types/schemas for Trade, PriceSnapshot, ImportResult, ValidationError, PortfolioSummary, Holding, Transaction.
- [x] Keep API contracts separate from internal calculation models where appropriate.
- [x] Validate all external input at the import boundary.

## 2. CSV import & validation
- [x] Load supplied `trades.csv`.
- [x] Support import/re-import.
- [x] Validate required columns exist.
- [x] Validate `trade_id` values are unique.
- [x] Validate timestamps are valid UTC ISO-8601 timestamps.
- [x] Validate exchange is Binance or Coinbase.
- [x] Validate symbol is BTC, ETH, SOL, CKB, or DOGE.
- [x] Validate side is BUY or SELL.
- [x] Validate quantity > 0.
- [x] Validate price_usd > 0.
- [x] Validate fee_usd >= 0.
- [x] Sort/validate transactions in ascending timestamp order for calculation.
- [x] Validate every SELL quantity is <= available quantity at that point.
- [x] Return clear, actionable validation errors.
- [x] Make import atomic: invalid input must not leave partially imported state.
- [x] Add tests for invalid and duplicate CSV rows.

## 3. Portfolio calculation engine
Implement deterministic calculation logic independent of controllers/UI.

### BUY
For each BUY:
- [x] `gross buy value = quantity × price_usd`
- [x] `cost added = gross buy value + fee_usd`
- [x] `new quantity = previous quantity + bought quantity`
- [x] `new cost basis = previous cost basis + cost added`
- [x] `average cost = new cost basis / new quantity`
- [x] Capitalize BUY fee into cost basis.

### SELL
For each SELL:
- [x] `gross proceeds = quantity × price_usd`
- [x] `net proceeds = gross proceeds - fee_usd`
- [x] `cost removed = average cost before sale × sold quantity`
- [x] `realized P&L = net proceeds - cost removed`
- [x] `new quantity = previous quantity - sold quantity`
- [x] `new cost basis = previous cost basis - cost removed`
- [x] SELL fee reduces proceeds.
- [x] SELL does not change average cost of remaining position.
- [x] If position is fully closed, set quantity, cost basis, and average cost to zero before a later BUY.
- [x] Never allow a short position.

### Current valuation
For each asset:
- [x] `current value = quantity held × current price`
- [x] `unrealized P&L = current value - current cost basis`
- [x] `total P&L = realized P&L + unrealized P&L`
- [x] `allocation = asset current value / portfolio current value`
- [x] `total fees = sum of BUY fees + SELL fees`

## 4. Numeric precision
- [x] Choose an explicit numeric type/strategy suitable for financial calculations.
- [x] Preserve sufficient precision during calculations.
- [x] Round only for display.
- [x] Document precision and rounding decisions in README.
- [x] Add tests asserting known numeric results, not only successful execution.

## 5. API / service boundary
Provide endpoints/services equivalent to:
- [x] Get portfolio summary.
- [x] Get holdings.
- [x] Get current price snapshot/as-of.
- [x] Get/filter/sort transactions.
- [x] Import/re-import trades CSV.
- [x] Reset/load sample data if needed.

For each API:
- [x] Typed request/response contracts.
- [x] Consistent error format.
- [x] Clear validation errors.
- [x] No leaked secrets/configuration.

## 6. Transaction Explorer backend support
Support:
- [x] Search/filter by asset.
- [x] Filter by exchange.
- [x] Filter by side.
- [x] Date-range filtering.
- [x] Timestamp sorting.
- [x] Pagination or another practical browsing mechanism.
- [x] Return all original CSV fields.
- [x] Include gross trade value.
- [x] Include fee information.

## 7. Missing/edge cases
Handle visibly and deterministically:
- [x] Missing prices.
- [x] Zero holdings.
- [x] Invalid import.
- [x] Duplicate trade IDs.
- [x] Unsupported values.
- [x] Invalid dates.
- [x] SELL greater than available quantity.
- [x] Unexpected calculation failure.

## 8. Backend automated tests — mandatory
At minimum:
- [x] Multiple BUYs at different prices.
- [x] BUY fees included in average cost.
- [x] Partial SELL.
- [x] SELL fees deducted from proceeds.
- [x] Full close followed by a new BUY.
- [x] Reject SELL that creates a short position.
- [x] Invalid CSV rows.
- [x] Duplicate CSV rows/trade IDs.
- [x] Assert exact/known numeric outcomes.
- [x] Add import-boundary tests.
- [x] Document one command that runs the full test suite.

## 9. Architecture / quality
- [x] Deterministic portfolio calculation separated from presentation/controller code.
- [x] Sensible module boundaries.
- [x] Explicit data contracts.
- [x] Secure configuration/secrets handling.
- [x] Clear observable failure states.
- [x] Avoid over-engineering; prioritize correctness and explain tradeoffs.

## 10. Definition of Done
- [x] Sample CSV imports successfully.
- [x] Invalid CSV is rejected atomically with actionable errors.
- [x] Portfolio calculations match the specification.
- [x] Current valuation uses only supplied `prices.csv`.
- [x] All mandatory calculation tests pass.
- [x] Transaction APIs support required filtering/sorting/pagination.
- [x] No live market/exchange API is used.
- [x] Test suite has one documented command.
