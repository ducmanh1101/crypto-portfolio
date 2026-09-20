# AI Coding-Agent Workflow

> Fill this in with your own real session log as you work. Keep 5-8 examples covering:
> requirement analysis & planning, architecture/data-model decisions, implementation,
> testing/debugging, and at least one case where you corrected or rejected AI output.
> One worked example is filled in below to show the expected level of detail — replace it
> with your actual first session, then add the rest as you go.

**Tools used:** Claude Code (Sonnet) [replace with whatever you actually used]

---

## Example 1 — Architecture: separating calculation logic from the HTTP layer

**Goal and context:** Needed to decide how to structure the NestJS backend so the portfolio
calculation logic could be unit-tested in isolation and wouldn't get tangled with
controllers/DB access.

**Prompt:**
> "Design a NestJS module structure for a portfolio calculator that processes BUY/SELL trades
> with weighted-average cost basis. The calculation logic must be testable without spinning up
> Nest's DI container or a database — pure functions only. Show me the file layout and the
> function signatures."

**Agent response:** Proposed splitting `calculation/` (pure functions/types, no Nest decorators)
from `portfolio/` (Nest service wrapping the pure engine + an injectable in-memory store) and
`import/` (CSV validation, reusing the calculation engine for the cross-row short-position
check instead of duplicating that logic).

**My review:** Checked that `portfolio-calculator.ts` has zero imports from `@nestjs/*` — confirmed
by running `grep nestjs` on the file, empty result. Ran the resulting unit tests without any Nest
test module bootstrapping to confirm they're fast/isolated.

**Outcome:** Accepted the structure as proposed. This is the layout used in `backend/src/`.

---

## Example 2 — [Requirement analysis / planning]

**Goal and context:**

**Prompt:**

**Agent response:**

**My review:**

**Outcome:**

---

## Example 3 — [Data-model decision]

**Goal and context:**

**Prompt:**

**Agent response:**

**My review:**

**Outcome:**

---

## Example 4 — Implementation: Full backend completion, PostgreSQL integration, and atomic validation

**Goal and context:** Needed to implement all unfinished requirements in `backend/TODO_BACKEND.md`,
connect PostgreSQL persistence via Docker Compose / Local Postgres, ensure atomic CSV imports with
strict validation, expose complete REST endpoints, and provide automated test suites while maintaining
zero-friction local development.

**Prompt:**
> "trong thư mục backend xem file @backend/TODO_BACKEND.md và source code hiện tại. hãy hoàn thành
> các chỉ mục có trong file MD xong mục nào check tick mục đó. Kết nối Database Postgre bằng Local
> hoặc Docker và update lại cách run backend"

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

---

## Example 5 — [Testing / debugging]

**Goal and context:**

**Prompt:**

**Agent response:**

**My review:**

**Outcome:**

---

## Example 6 — [Corrected or rejected AI output — required]

**Goal and context:**

**Prompt:**

**Agent response:**

**My review:** *(What specifically did you check that revealed the problem?)*

**Outcome:** *(What did you change, and why was the AI's version wrong or unsuitable?)*
