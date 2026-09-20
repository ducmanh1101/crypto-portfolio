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

## Running Automated Tests

Run the complete backend test suite with one command:

```bash
cd backend && npm test
```

This executes all unit and integration tests:
- `portfolio-calculator.spec.ts`: Weighted-average cost, BUY fee capitalization, partial SELLs, SELL fee deduction, full close followed by BUY, short position rejection, zero holdings, missing prices, exact decimal outcomes.
- `csv-validator.spec.ts`: Column validation, strict UTC ISO-8601 timestamps, enum whitelists (exchanges, symbols, sides), positive quantity/price, non-negative fee, atomic rejection of duplicates and invalid rows.
- `portfolio.service.spec.ts`: Service and controller integration tests (filtering, sorting, date ranges, pagination, snapshot generation).
