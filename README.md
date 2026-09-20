# Crypto Portfolio Analytics

A full-stack dashboard for analyzing a crypto portfolio's holdings, cost basis, and P&L from a supplied
trade history (no live market data). Built with NestJS + TypeORM + PostgreSQL (backend) + Next.js (frontend).

---

## Architecture

```
backend/   NestJS API (TypeScript)
  src/calculation/   Pure calculation engine & types (independent of framework/DB)
  src/database/      TypeORM PostgreSQL entities & connection checker
  src/import/        CSV parsing & validation (row checks + cross-row short position verification)
  src/portfolio/     PortfolioStore (PostgreSQL persistence + in-memory fallback) & PortfolioService
  src/trades/        Transaction Explorer API (filter by symbol, exchange, side, date range, sort, pagination)
frontend/  Next.js App Router
  app/               Dashboard + Transactions pages
  components/        SummaryCards, HoldingsTable, Charts, ImportPanel, TransactionTable
  lib/               API client, shared types, formatting helpers
data/       Sample & assignment CSV files (trades.csv, prices.csv, trades.sample.csv, prices.sample.csv)
docker-compose.yml   PostgreSQL service configuration (port 5432)
```

**Data flow:**
CSV upload → validate (column check, format check, ranges, duplicate `trade_id`, then cross-row short-position replay using the calculation engine) → atomic database replace within an ACID transaction → `GET /api/portfolio` recomputes the full snapshot fresh from the trade history.

---

## Portfolio calculation approach

Implemented in `backend/src/calculation/portfolio-calculator.ts`, adhering to the specification's weighted-average cost basis rules:

- Trades are grouped by asset and processed in ascending timestamp order.
- **BUY**: fee is capitalized into cost basis (`cost added = qty × price + fee`); average cost recomputed as `new cost basis / new quantity`.
- **SELL**: average cost is snapshotted *before* the sale and used to calculate `cost removed`; the sale does not alter the average cost of the remaining position. Fee reduces net proceeds (`net proceeds = gross proceeds - fee`), and `realized P&L = net proceeds - cost removed`.
- **Full close**: quantity, cost basis, and average cost reset cleanly to zero so subsequent BUYs start fresh without leftover rounding dust. Realized P&L is retained.
- **Short position rejection**: any SELL attempting to sell more than currently held raises `ShortPositionError` and causes atomic rejection at the import boundary.
- **Current valuation**: `current value = qty × price`, `unrealized P&L = current value − cost basis`, `total P&L = realized + unrealized`, `allocation % = asset value / portfolio value`.

---

## Precision and rounding decisions

All monetary and quantity arithmetic uses [`decimal.js`](https://github.com/MikeMcl/decimal.js) internally (arbitrary-precision decimal arithmetic) to prevent IEEE-754 floating-point error compounding across sequential trades.
- Intermediate calculations retain full precision.
- Values cross to formatted strings and numbers only at the presentation boundary (`frontend/lib/format.ts`).
- The API transmits numbers as strings in DTOs to avoid precision loss over JSON serialization.

---

## Database & Local Setup

### 1. Database Setup (PostgreSQL)

You can run PostgreSQL either via **Docker Compose** or using a **Local PostgreSQL** service:

#### Option A: Docker Compose (Recommended)
From the project root, start the PostgreSQL container:
```bash
docker-compose up -d
```
This launches a PostgreSQL 16 container on `localhost:5432` with:
- User: `postgres`
- Password: `postgrespassword`
- Database: `crypto_portfolio`

To stop the database:
```bash
docker-compose down
```

#### Option B: Local PostgreSQL
Ensure PostgreSQL is running locally on port 5432 and create the database:
```bash
createdb crypto_portfolio
```
Update `backend/.env` with your local credentials if different from default.

> [!NOTE]
> **Graceful In-Memory Fallback:**
> If PostgreSQL is not currently running, the backend automatically logs a warning and falls back to its in-memory store so development and testing can proceed seamlessly without crashes.

---

### 2. Backend

```bash
cd backend
npm install

# Start in development mode (with hot-reload):
npm run start:dev

# Or build and start production:
npm run build
npm run start:prod

# Run automated tests:
npm test
```

When the backend starts:
- It automatically checks if the database is empty; if so, it seeds initial data from `data/trades.csv` and `data/prices.csv`.
- Runs on `http://localhost:3001`.

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev   # Runs on http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | HTTP API port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | `postgrespassword` | PostgreSQL password |
| `DB_DATABASE` | `crypto_portfolio` | PostgreSQL database name |
| `DATABASE_URL` | *(optional)* | Full connection string (e.g. `postgresql://user:pass@host:5432/db`) |
| `USE_POSTGRES` | `true` | Set to `false` to force in-memory storage mode |

### Frontend (`frontend/.env.local`)
| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API URL |

---

---

## API Documentation & Swagger

Interactive Swagger UI and OpenAPI 3.0 specification are built-in:

* **Swagger UI (Interactive Playground):** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
* **OpenAPI Raw JSON Endpoint:** [http://localhost:3001/api/docs-json](http://localhost:3001/api/docs-json)
* **Static OpenAPI File:** [`swagger.json`](file:///Users/phuongtrinh/Documents/GitHub/crypto-portfolio/swagger.json) (or `backend/swagger.json`) — ready for import into Postman, Insomnia, or frontend code-generation tools (`openapi-typescript-codegen`, `orval`, etc.).

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/portfolio` | Full portfolio snapshot (summary + all asset holdings) |
| `GET` | `/api/portfolio/summary` | Portfolio summary metrics only |
| `GET` | `/api/portfolio/holdings` | Current holdings list |
| `GET` | `/api/prices` | Latest price snapshot and as-of timestamp |
| `GET` | `/api/trades` | Filtered, sorted, paginated transactions (`symbol`, `exchange`, `side`, `from`, `to`, `sort`, `page`, `pageSize`) |
| `POST` | `/api/import/trades` | Multipart CSV upload for `trades.csv` (atomic validation & DB replace) |
| `POST` | `/api/import/prices` | Multipart CSV upload for `prices.csv` |
| `POST` | `/api/portfolio/reset` | Reset and reload dataset from `data/trades.csv` and `data/prices.csv` |

---

## Running Automated Tests (One Documented Command)

The evaluator can run the full automated test suite with **a single command** directly from the repository root:

```bash
npm test
```
*(Or `npm test` inside `backend/`, or `npm run test:all` to run both backend and frontend suites simultaneously)*.

All tests execute in isolated in-memory mode (no Docker or external database required) in **~2.5 seconds** and assert **known numeric results**, not merely code execution:

| Test Suite | File | Specific Requirement Covered | Key Assertions |
|---|---|---|---|
| **Multiple BUYs & Avg Cost** | [`portfolio-calculator.spec.ts`](backend/src/calculation/portfolio-calculator.spec.ts) | Multiple BUYs at different prices | Asserts exact weighted average cost `15000` |
| **BUY Fee Capitalization** | [`portfolio-calculator.spec.ts`](backend/src/calculation/portfolio-calculator.spec.ts) | BUY fees included in average cost | Asserts capitalized cost basis `10050` |
| **Partial SELLs** | [`portfolio-calculator.spec.ts`](backend/src/calculation/portfolio-calculator.spec.ts) | Partial SELLs without changing remaining average cost | Asserts remaining cost basis `10000` and average cost `10000` |
| **SELL Fee Deduction** | [`portfolio-calculator.spec.ts`](backend/src/calculation/portfolio-calculator.spec.ts) | SELL fees deducted from proceeds | Asserts exact realized P&L `1980` |
| **Full Close + New BUY** | [`portfolio-calculator.spec.ts`](backend/src/calculation/portfolio-calculator.spec.ts) | Full close followed by a new BUY | Asserts clean reset to `30000` with preserved realized P&L `5000` |
| **Short Position Rejection** | [`portfolio-calculator.spec.ts`](backend/src/calculation/portfolio-calculator.spec.ts) | Rejection of a SELL that would create a short position | Throws `ShortPositionError` and halts calculation |
| **Numeric Precision** | [`portfolio-calculator.spec.ts`](backend/src/calculation/portfolio-calculator.spec.ts) | High-precision Decimal arithmetic without float compounding | Asserts exact string `3317.7333095922` and `184.9310354078` |
| **CSV Row Validation** | [`csv-validator.spec.ts`](backend/src/import/csv-validator.spec.ts) | Invalid or duplicate CSV rows | Rejects duplicate IDs, bad timestamps, unsupported enums, negative values |
| **Cross-Row Short Check** | [`csv-validator.spec.ts`](backend/src/import/csv-validator.spec.ts) | Replay asset trades before commit | Rejects cross-row SELL exceeding cumulative balance with atomic rollback |
| **Integration & Service** | [`portfolio.service.spec.ts`](backend/src/portfolio/portfolio.service.spec.ts) | Service & controller contracts | Filtering, sorting, pagination, date-range, and atomic rollback replace |

---

## Deployment & Production Hosting

The application is architected for zero-friction cloud deployment:

### Live Application URL
* **Live Deployment URL:** `https://your-deployment-url.com` *(Replace with deployed URL)*
* **Backend API / Swagger URL:** `https://your-deployment-url.com/api/docs`

### Quick Deployment Options

#### Option 1: Docker (Single Command Full-Stack)
Both `backend/Dockerfile` and `frontend/Dockerfile` are containerized with multi-stage production builds:
```bash
# Build and run the entire stack (Postgres + Backend + Frontend):
docker-compose up -d --build
```
- Frontend UI: `http://localhost:3000`
- Backend API & Swagger: `http://localhost:3001/api/docs`

#### Option 2: Cloud PaaS (Vercel + Render / Railway)
1. **Database:** Provision a managed PostgreSQL database on Neon, Supabase, Railway, or Render.
2. **Backend (Render / Railway):**
   - Root directory: `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm run start:prod`
   - Environment variables: `DATABASE_URL` (with SSL auto-negotiation), `PORT=3001`.
3. **Frontend (Vercel):**
   - Root directory: `frontend`
   - Framework: Next.js
   - Environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com`

---

## Assumptions, Limitations, and Tradeoffs

### Assumptions
1. **Source of Truth:** Supplied `trades.csv` and `prices.csv` represent the complete, authoritative history. In accordance with requirements, no external market price APIs are queried.
2. **Deterministic Sequence:** BUY and SELL orders for each asset are strictly ordered by ascending ISO-8601 UTC timestamp.
3. **Currency Standardization:** All trade values, fees, and current market prices are denominated in USD.

### Limitations
1. **Fixed Asset Scope:** Currently restricted to the 5 specified assets (`BTC`, `ETH`, `SOL`, `CKB`, `DOGE`) and 2 exchanges (`Binance`, `Coinbase`) to enforce strict domain validation.
2. **Batch Re-import:** Re-importing `trades.csv` performs an atomic replace of the trade history rather than incremental diff synchronization.

### Engineering Tradeoffs
1. **Arbitrary Precision Arithmetic (`decimal.js`) vs Floating Point:**
   - *Decision:* Used `decimal.js` throughout the calculation engine instead of native JavaScript `Number`.
   - *Tradeoff:* Incurs a minor CPU overhead compared to primitive floats, but completely eliminates IEEE-754 precision compounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`), ensuring financial calculations reconcile to the exact cent across hundreds of trades.
2. **Dual-Mode Persistence (PostgreSQL + In-Memory Fallback):**
   - *Decision:* Implemented automatic socket health-check on startup (`postgres-check.ts`). If PostgreSQL is offline, the service seamlessly falls back to in-memory mode without crashing.
   - *Tradeoff:* Added a tiny abstraction layer in `PortfolioStore`, but guarantees zero setup friction for evaluators running tests or local development without Docker.
3. **Cross-Row Short Position Validation at Import Boundary:**
   - *Decision:* Reused the pure calculation engine (`replayAssetTrades`) during CSV validation to detect short positions before committing to the database.
   - *Tradeoff:* Replays asset history twice (once during validation, once during presentation queries), but ensures the validation rule can never drift from the calculation engine and guarantees 100% atomic rollback safety.

---

## Future Improvements

1. **Alternative Tax Lot Accounting:** Support FIFO (First-In, First-Out), LIFO, and Specific Identification (SpecID) tax-lot methods alongside weighted-average cost basis.
2. **Real-time Price WebSockets:** Integrate WebSocket / Server-Sent Events (SSE) streaming for live portfolio recalculations when connected to live exchange feeds.
3. **Multi-Currency Support:** Support fiat pairs (EUR, GBP, VND) with historical exchange-rate normalization.
4. **Enhanced CSV Mapping Engine:** User-configurable column mapping UI allowing direct import of arbitrary exchange CSV formats (Kraken, KuCoin, OKX).


