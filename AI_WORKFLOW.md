# AI Coding-Agent Workflow

> Real session log documenting the full-stack engineering workflow for the Crypto Portfolio Analytics platform. Covers requirement analysis & planning, data-model decisions, full backend and frontend implementations, testing/debugging, and human-in-the-loop corrections/redesigns.

**Tools used:** Google Antigravity (Gemini 3.8 Flash) & Claude Code

---

## Example 1 — Architecture: separating calculation logic from the HTTP layer

**Goal and context:** Needed to decide how to structure the NestJS backend so the portfolio calculation logic could be unit-tested in isolation and wouldn't get tangled with controllers/DB access.

**Prompt:**
> "Design a NestJS module structure for a portfolio calculator that processes BUY/SELL trades with weighted-average cost basis. The calculation logic must be testable without spinning up Nest's DI container or a database — pure functions only. Show me the file layout and the function signatures."

**Agent response:** Proposed splitting `calculation/` (pure functions/types, no Nest decorators) from `portfolio/` (Nest service wrapping the pure engine + an injectable in-memory store) and `import/` (CSV validation, reusing the calculation engine for the cross-row short-position check instead of duplicating that logic).

**My review:** Checked that `portfolio-calculator.ts` has zero imports from `@nestjs/*` — confirmed by running `grep nestjs` on the file, empty result. Ran the resulting unit tests without any Nest test module bootstrapping to confirm they're fast/isolated.

**Outcome:** Accepted the structure as proposed. This is the layout used in `backend/src/`.
- **Relevant commit:** [`b0aebed`](https://github.com/ducmanh1101/crypto-portfolio/commit/b0aebeda717cf842f2522cde37c1de5fdb3dd0cc) - *init project & backend base*

---

## Example 2 — Requirement analysis & Planning: Senior Frontend Architecture & Data Flow

**Goal and context:** Needed to plan and execute the full frontend implementation based on `frontend/TODO_FRONTEND.md` and `backend/swagger.json`. Required establishing a robust client data layer that avoids full page reloads, introduces TanStack Query caching, defines explicit TypeScript contracts matching Swagger DTOs, and designs a Web3 fintech UI.

**Prompt:**
> "Analyze the frontend requirements in frontend/TODO_FRONTEND.md alongside the existing codebase, and cross-reference with backend/swagger.json. Create an architectural plan to implement all checklist items, establishing clean data flow, caching, accessibility, and component boundaries according to senior frontend standards."

**Agent response:** Proposed a comprehensive senior frontend technical implementation plan:
1. **Caching & Data Layer:** Configured `@tanstack/react-query` v5 with dedicated query/mutation hooks (`usePortfolio`, `useTrades`, `useImportMutations`) to replace clunky `window.location.reload()` calls with reactive cache invalidation (`queryClient.invalidateQueries()`).
2. **DTO & API Synchronization:** Generated complete TypeScript contracts in `lib/types.ts` mirroring `backend/swagger.json` (`PortfolioSummaryDto`, `HoldingDto`, `TransactionDto`, `ValidationErrorDto`, `ImportErrorResponseDto`).
3. **Core Visual Components:** Designed 6 KPI headline cards, interactive SVG Donut Allocation Chart, Dual-Bar Realized vs Unrealized P&L Chart with a centered zero axis, 10-column Holdings table with closed-position retention, and a 9-field Transaction Explorer with multi-filter and client-side CSV export.
4. **Validation & Atomic Safety:** Built drag-and-drop CSV importer with structured error inspection displaying row, field, and actionable message for atomic rollback rejections.
5. **Testing Strategy:** Outlined Vitest + React Testing Library suite for all critical components and formatters.

**My review:** Reviewed and approved the design plan artifact (`implementation_plan.md`). Confirmed that presentation logic remained strictly separated from backend calculation results, and that all 10 checklist sections in `TODO_FRONTEND.md` were addressed without adding unnecessary blockchain or authentication overhead.

**Outcome:** Approved execution. The agent scaffolded dependencies, built the component hierarchy, connected the query hooks, and fulfilled all requirements.
- **Relevant commits:** [`8804bfc`](https://github.com/ducmanh1101/crypto-portfolio/commit/8804bfc7452dfa1faa7f9dcd915d27378442ff87) (*Add Swagger docs, API DTOs & annotate controllers*) & [`bf0a03c`](https://github.com/ducmanh1101/crypto-portfolio/commit/bf0a03ce5bda8ac7637b54624bb7eefa8f2bc281) (*Build crypto portfolio dashboard frontend*)

---

## Example 3 — Data-Model Decision: Precision Boundary, Financial Accessibility & Data Reconciliation

**Goal and context:** Needed to establish how numerical and financial values cross the network boundary and are displayed without precision loss or accessibility issues, and ensure frontend headline metrics verifiably reconcile with holdings data.

**Prompt:**
> "Define the precision boundaries and formatting rules between backend Decimal calculations and frontend presentation. How should sub-cent crypto prices (e.g. CKB), accessible signed financial indicators, closed position retention, and automated reconciliation between summary metrics and individual holdings be designed?"

**Agent response:**
1. **Precision Boundary (`lib/format.ts`):** Backend preserves full Decimal precision and serializes numbers as strings. The frontend formats values at the display boundary. Added intelligent sub-cent detection in `formatUsd` so micro-cap assets like CKB ($0.00715) display with appropriate decimal places rather than rounding to `$0.00` or `$0.01`.
2. **Financial Accessibility:** Implemented `formatSignedUsd` and semantic status badges combining explicit leading signs (`+` / `-`), text tags (`(gain)` / `(loss)`, `Profit (Closed)` / `Loss (Closed)`, `Open Gain` / `Open Loss`, `Net Gain` / `Net Loss`), and directional trend icons (`TrendingUp` / `TrendingDown`), guaranteeing full legibility for color-blind users.
3. **Continuous Reconciliation Engine:** Built automated verification into `usePortfolio` that computes `computedSum = sum(positions.currentValue)` and compares against `summary.currentValue`, rendering a live verification badge ("✓ Reconciled with Holdings Table") on the dashboard.
4. **Closed Position Retention:** Position records with `quantityHeld == 0` but non-zero `realizedPnl` are explicitly retained in `HoldingsTable` with a distinct "Closed" badge and toggle filter.

**My review:** Checked edge cases with 0, negative values, null prices, and sub-cent numbers. Verified that calculation reconciliation accurately matched backend outputs.

**Outcome:** Adopted the formatting architecture across all cards, charts, and tables.
- **Relevant commit:** [`bf0a03c`](https://github.com/ducmanh1101/crypto-portfolio/commit/bf0a03ce5bda8ac7637b54624bb7eefa8f2bc281) - *Build crypto portfolio dashboard frontend*

---

## Example 4 — Implementation: Full backend completion, PostgreSQL integration, and atomic validation

**Goal and context:** Needed to implement all unfinished requirements in `backend/TODO_BACKEND.md`, connect PostgreSQL persistence via Docker Compose / Local Postgres, ensure atomic CSV imports with strict validation, expose complete REST endpoints, and provide automated test suites while maintaining zero-friction local development.

**Prompt:**
> "Inspect backend/TODO_BACKEND.md and the current codebase in backend/. Complete all checklist items in the markdown file and tick them off once done. Connect PostgreSQL persistence via local or Docker Compose, and update instructions on how to run the backend."

**Agent response:** Proposed and executed a comprehensive implementation plan:
1. **Database & Docker:** Added `docker-compose.yml` for PostgreSQL 16, created `TradeEntity` and `PriceSnapshotEntity` with TypeORM (`numeric(28, 10)` precision), and implemented a proactive port checker (`postgres-check.ts`) in `main.ts` that automatically falls back to in-memory mode if Postgres isn't running, preventing server crashes during local dev.
2. **Persistence & Atomicity:** Upgraded `PortfolioStore` with TypeORM transaction manager so trades CSV re-imports are committed atomically (ACID) and auto-seeds sample data on first boot if DB is empty.
3. **Data Contracts & DTOs:** Defined explicit domain aliases (`Holding`, `Transaction`) and API boundary DTOs (`HoldingDto`, `TransactionDto`, `PortfolioSnapshotDto`) in `types.ts`, converting `Decimal` values to strings for JSON transport.
4. **Validation & API:** Implemented strict ISO-8601 UTC regex and cross-row short-position validation in `csv-validator.ts`. Extended `TradesController` (case-insensitive filter, full-day date range, sorting, pagination) and `PortfolioController` (`/summary`, `/holdings`, `/prices`, `/reset`).
5. **Testing:** Built comprehensive unit and integration test suites across 3 files (`portfolio-calculator.spec.ts`, `csv-validator.spec.ts`, `portfolio.service.spec.ts`) covering 38 test cases.

**My review:**
1. Ran `npm test` to ensure all 38 tests pass in isolated in-memory mode without external DB dependency (~2.4s execution time).
2. Tested `npm run build` to confirm zero TypeScript compilation errors.
3. Tested live API with curl: verified `/api/portfolio/summary`, `/api/portfolio/holdings`, `/api/trades` pagination, and `/api/portfolio/reset`.
4. Tested atomic validation: uploaded an invalid CSV row (negative quantity); confirmed HTTP 400 rejection and verified stored trades remained unchanged.
5. Checked that all items in `backend/TODO_BACKEND.md` were ticked `[x]` and `README.md` was updated with Docker setup and running instructions.

**Outcome:** Accepted the entire implementation. The backend is now fully functional, persistent with PostgreSQL, thoroughly tested, and resilient against missing services.
- **Relevant commits:** [`b0aebed`](https://github.com/ducmanh1101/crypto-portfolio/commit/b0aebeda717cf842f2522cde37c1de5fdb3dd0cc) (*init project & backend base*) & [`8804bfc`](https://github.com/ducmanh1101/crypto-portfolio/commit/8804bfc7452dfa1faa7f9dcd915d27378442ff87) (*Add Swagger docs, API DTOs & annotate controllers*)

---

## Example 5 — Implementation: Full Frontend Execution, TanStack Query Caching & Swagger API Integration

**Goal and context:** Implement the entire crypto portfolio analytics frontend in Next.js 14 based on `frontend/TODO_FRONTEND.md` and `backend/swagger.json`, delivering high code quality, component separation, reactive client-side caching, and responsive Web3 UI.

**Prompt:**
> "Review the frontend directory and TODO_FRONTEND.md alongside the existing codebase, then implement all checklist items. Solve problems, design system architecture, components, and code quality according to senior frontend standards. Integrate with the backend APIs specified in backend/swagger.json. Install and leverage necessary libraries (such as TanStack React Query for caching) to elevate UX. Build a professional Web3-inspired UI with smooth animations."

**Agent response:** Executed the complete frontend buildout:
1. **Package Setup:** Installed and configured `@tanstack/react-query`, `lucide-react`, `tailwindcss`, `postcss`, `autoprefixer`, and `clsx`/`tailwind-merge`.
2. **Data & State Management:** Implemented `lib/api.ts` with typed `ApiError`, `lib/query-client.ts`, and query/mutation hooks (`usePortfolio`, `useTrades`, `useImportMutations`).
3. **Core Dashboard Components:**
   - `SummaryCards.tsx`: 6 KPI cards, ROI return indicators, prices snapshot metadata, and continuous holdings reconciliation.
   - `Charts.tsx`: Interactive SVG Donut allocation chart with slice hover, centered total valuation, and dual-bar P&L chart with normalized zero axis.
   - `HoldingsTable.tsx`: 10-column table with column sorting, closed positions retention (`quantity == 0` with non-zero realized P&L), and missing price fallback (`Price N/A` warning).
4. **Transaction Explorer (`TransactionTable.tsx`):** All 9 trade fields from `trades.csv`, multi-criteria filtering (asset, exchange, side, date range), ID search, timestamp sort, pagination controls, and client-side CSV export.
5. **Import & Reset Modal (`ImportModal.tsx`):** Drag-and-drop for `trades.csv` and `prices.csv`, actionable validation error table (`row`, `field`, `message`), atomic rollback safety guarantee, and sample data reset.

**My review:**
1. Ran `npm run build` in `frontend/` — confirmed clean compilation with 0 errors (`Route /: 9.5 kB`, `First Load JS: 87 kB`).
2. Tested live interaction with backend (`http://localhost:3001`): verified summary metrics reconcile with holdings table, filters update transactions seamlessly, and importing an invalid CSV displays row-by-row validation errors.
3. Checked that all items in `frontend/TODO_FRONTEND.md` were ticked `[x]`.

**Outcome:** Accepted the implementation. The frontend dashboard is fully functional, type-safe, reactive, and delivers an exceptional user experience.
- **Relevant commit:** [`bf0a03c`](https://github.com/ducmanh1101/crypto-portfolio/commit/bf0a03ce5bda8ac7637b54624bb7eefa8f2bc281) - *Build crypto portfolio dashboard frontend*

---

## Example 6 — Testing & Debugging: Full-Stack Verification, Realistic CSV Import Boundaries & DOM Refinement

**Goal and context:** Needed to verify and debug the complete platform against the assessment specification, `backend/TODO_BACKEND.md`, and `frontend/TODO_FRONTEND.md`. This required automated test suites across both tiers, testing realistic 100–150 trade CSV datasets (valid vs invalid) at the API and UI boundaries, verifying atomic rollback guarantees, and resolving frontend testing selector conflicts.

**Prompt:**
> "Test the generated CSV files at the backend API layer and frontend UI layer to observe the error responses and verify compliance with TODO_BACKEND.md and TODO_FRONTEND.md. Run automated test suites for both backend and frontend. Then summarize the complete testing methodology and results in Example 6 — Testing & Debugging of AI_WORKFLOW.md."

**Agent response:** Executed a 360-degree full-stack testing and validation campaign:
1. **Realistic CSV Test Datasets (100–150 Trades & Price Snapshots):**
   - Built 5 trades datasets and 5 price snapshot datasets in `data/` to stress-test the validation engine:
     - `trades_valid_1.csv` (125 trades) & `trades_valid_2.csv` (135 trades): 100% valid BUY/SELL sequences across BTC, ETH, SOL, CKB, DOGE with Binance & Coinbase, zero-fee cases, and DCA patterns.
     - `trades_invalid_1.csv` (115 trades): Tests syntax & schema violations (missing `trade_id`, duplicate IDs, non-UTC ISO timestamps, unsupported exchange `Kraken`, unsupported symbol `XRP`, invalid side `HOLD`, negative quantity/price/fee, non-numeric strings).
     - `trades_invalid_2.csv` (120 trades): 100% syntactically valid rows that intentionally trigger cross-row **Short Position Rejection** (`validateNoShortPositions` / `replayAssetTrades`) when a SELL exceeds held balance.
     - `trades_invalid_3.csv` (120 trades): Tests boundary zero values (`quantity = 0`, `price_usd = 0`), lowercase values (`binance`, `btc`, `buy`), empty fields, currency formatting (`$3,950.00`), and missing `Z` timezone suffixes.
     - `prices_valid_1.csv` & `prices_valid_2.csv` (5 tokens each): Valid market snapshots.
     - `prices_invalid_1.csv`, `prices_invalid_2.csv`, `prices_invalid_3.csv`: Tests missing required header column (`price_usd`), unsupported token (`USDT`), negative/zero prices, and empty fields.

2. **Backend API Boundary Testing (`POST /api/import/*`):**
   - Executed live HTTP multipart calls against the running NestJS server:
     - `trades_valid_1.csv` & `trades_valid_2.csv`: Returned **HTTP 200 OK** (`{"imported": 125}` and `{"imported": 135}`), triggering instant deterministic portfolio recalculation.
     - `trades_invalid_1.csv`: Returned **HTTP 400 Bad Request** with structured error array identifying exact rows (e.g. `Row 4: trade_id is required`, `Row 13: Duplicate trade_id "TRD-INV1-0012"`, `Row 36: Unsupported exchange "Kraken"`).
     - `trades_invalid_2.csv`: Returned **HTTP 400 Bad Request** with short-position errors (e.g. `Trade TRD-INV2-0001: SELL 0.5 BTC exceeds available balance 0`, `SELL 500 SOL exceeds available balance 31.2`).
     - `trades_invalid_3.csv`: Returned **HTTP 400 Bad Request** catching boundary 0s, lowercase fields, and currency formatting.
     - **Atomic Safety Verification:** Confirmed via `GET /api/trades` that failed imports left 0 partial rows in the database (ACID rollback).
     - `POST /api/portfolio/reset`: Re-seeded database back to the canonical 200 trades and 5 price snapshots.

3. **Frontend Component & UI Error Handling Testing:**
   - Expanded `frontend/tests/ImportModal.test.tsx` and `frontend/tests/TopNav.test.tsx` with automated Vitest specs:
     - Verified modal rendering, tab switching, Escape key dismissal, and atomic rollback notice.
     - Tested API rejection flow: verified the reactive error alert (`"{N} Validation Errors Encountered (Atomic Rollback Active)"`), `Row {err.row}` badges, `[{err.field}]` tags, and actionable error messages.
     - Tested successful import flow: verified success banner (`"Atomic import successful! 125 trades reloaded into portfolio."`).

4. **Automated Test Suites Execution:**
   - **Backend:** Ran Jest suite (`portfolio-calculator.spec.ts`, `csv-validator.spec.ts`, `portfolio.service.spec.ts`, `http-exception.filter.spec.ts`). All **4 test suites and 41/41 tests passed (100%)**.
   - **Frontend:** Ran Vitest suite (`format.test.ts`, `SummaryCards.test.tsx`, `HoldingsTable.test.tsx`, `TransactionTable.test.tsx`, `ImportModal.test.tsx`, `TopNav.test.tsx`). All **6 test suites and 38/38 tests passed (100%)**.
   - **Overall Suite:** **10 test suites and 79/79 automated tests passing (100%)**.
   - **Production Builds:** Both `nest build` (backend) and `next build` (frontend static generation 6/6) succeeded with zero errors.

**My review & debugging:**
1. **DOM Selector Mismatches:** In `SummaryCards.test.tsx` and `HoldingsTable.test.tsx`, regex `/Realized P&L/i` matched both "Realized P&L" and "Unrealized P&L". Disambiguated using anchored regex `/^Realized P&L/i` and `getAllByText`.
2. **Transaction Filter Disambiguation:** Searching for `"Binance"` matched both `<option>` text and `<span>` table badges; resolved by scoping queries to table cells.
3. **File Input Selector:** In `ImportModal.test.tsx`, `getByLabelText` failed because the file dropzone used paragraph text rather than `<label>`. Fixed by querying via `#csv-file-input` directly on the container.
4. **Short-Position Edge Cases:** Verified that `validateNoShortPositions` correctly evaluates transactions chronologically rather than CSV row order, preventing false negatives if files are unsorted.

**Outcome:** All checklist requirements in `TODO_BACKEND.md` and `TODO_FRONTEND.md` were independently verified and validated. Full test suites pass with 100% coverage of core calculation and import boundaries (79 passing tests total across backend and frontend). Both production builds compile cleanly.
- **Relevant commits:** [`98d81ea`](https://github.com/ducmanh1101/crypto-portfolio/commit/98d81ea64d852089b0a1f0559eb8fc78cf7d8fd5) (*Add test datasets, Dockerfiles, and DB checks*), [`8459c72`](https://github.com/ducmanh1101/crypto-portfolio/commit/8459c7225d66c4be83447311da34c82da2abb910) (*Add validation CSV fixtures and deps*), & [`dfb01b5`](https://github.com/ducmanh1101/crypto-portfolio/commit/dfb01b598962a866497a2b6c141a5b1835d0e5df) (*Harden backend API and refresh frontend UX*)

---

## Example 7 — Corrected / Rejected AI Output: Eliminating Generic "AI-Generated" UI & Building a 3-Way Theme Engine

**Goal and context:** Upon reviewing the initial frontend implementation, the functional requirements and checklist were satisfied, but the UI appearance felt overly predictable and typical of generic AI generation (symmetrical 6-column grid of identical small cards, hardcoded dark mode, and cookie-cutter layout). Requested an avant-garde / "phá cách" redesign with personality and a full 3-way Theme Engine (Dark 🌙, Light ☀️, System 💻).

**Prompt:**
> "/generative_ui The layout is functional, but the UI looks too generic and AI-generated. Revamp it with an avant-garde, high-craft fintech look. Also, add theme configuration with a 3-way switcher supporting Dark, Light, and System modes."

**Agent initial version (rejected/corrected):** The initial design used a standard, uniform 6-column grid where every KPI card was an identical rectangle with an icon in the top right. It was locked to dark mode (`<html className="dark">`), had no theme switcher, and lacked the dynamic feel of modern crypto terminals (like TradingView, Hyperliquid, or Uniswap).

**What revealed the problem:**
1. Visual monotony: Equal visual weight was given to minor metrics (fees) as major metrics (total portfolio value).
2. Lack of theme versatility: Hardcoded dark utility classes (`text-white`, `bg-slate-900`) made the interface inaccessible or broken for users who prefer high-contrast light mode for daylight usage.
3. Missing active terminal elements: Lacked real-time price feeds that traders expect on high-end dashboards.

**What was changed:**
1. **Asymmetric Hero Command Center:** Replaced the 6 identical boxes with a commanding terminal layout:
   - Left Master Hero Stage: Huge monospace net worth (`$60,620.89`), live valuation badge, integrated Realized vs Unrealized breakdown strip, and Total ROI pill (`-7.3%`).
   - Right Secondary Pillars: Tactile fintech blocks for Cost Basis, Realized P&L, Unrealized P&L, and Total Fees with clear status badges.
2. **Snapshot Ticker Feed:** Added a live market ticker tape beneath the navigation bar displaying snapshot prices (`BTC $111,500`, `ETH $4,025`, `SOL $208.50`, `CKB $0.00715`, `DOGE $0.242`).
3. **Full 3-Way Theme Engine (`ThemeProvider.tsx` & `ThemeToggle.tsx`):**
   - Context provider supporting `dark`, `light`, and `system` modes.
   - Persists user choice to `localStorage` (`krypton-theme`).
   - Automatically synchronizes with OS preference when in `system` mode via `window.matchMedia('(prefers-color-scheme: dark)')`.
   - Injected an inline anti-FOUC script into `<head>` in `layout.tsx` to prevent theme flashing on load.
   - Built an interactive segmented pill control (☀️ Light / 🌙 Dark / 💻 System) in `TopNav.tsx`.
4. **Dual Light/Dark Tuning:** Individually styled both themes:
   - Light: Crisp white cards, slate-50 backgrounds, high-contrast typography, emerald/rose badges.
   - Dark: Obsidian backdrop (`#080b11`), deep slate panels, subtle glassmorphic glow.
5. **Interactive Generative UI Preview:** Created `portfolio_preview.html` allowing immediate in-chat theme toggling and layout inspection.

**Outcome:** The redesigned UI successfully broke away from generic templates, delivering an avant-garde crypto terminal with full theme customization. All 38 automated frontend tests continue to pass (100%), and Next.js production build succeeded with zero errors.
- **Relevant commits:** [`bf0a03c`](https://github.com/ducmanh1101/crypto-portfolio/commit/bf0a03ce5bda8ac7637b54624bb7eefa8f2bc281) (*Build crypto portfolio dashboard frontend*) & [`dfb01b5`](https://github.com/ducmanh1101/crypto-portfolio/commit/dfb01b598962a866497a2b6c141a5b1835d0e5df) (*Harden backend API and refresh frontend UX*)

