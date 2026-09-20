import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PortfolioStore } from '../portfolio/portfolio.service';
import {
  PaginatedTransactionsDto,
  TradesQueryDto,
  toTransactionDto,
} from '../calculation/types';

export type TradesQuery = TradesQueryDto;

/** GET /api/trades — powers the Transaction Explorer table. */
@ApiTags('Transaction Explorer')
@Controller('api/trades')
export class TradesController {
  constructor(private readonly store: PortfolioStore) {}

  @Get()
  @ApiOperation({
    summary: 'Search, filter, sort, and paginate transactions',
    description: 'Returns transactions matching filter criteria (symbol, exchange, side, date range). Supports timestamp sorting (asc/desc) and pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated transactions list returned successfully',
    type: PaginatedTransactionsDto,
  })
  async list(@Query() query: TradesQueryDto): Promise<PaginatedTransactionsDto> {
    let trades = await this.store.getTrades();

    if (query.symbol) {
      const symUpper = query.symbol.trim().toUpperCase();
      trades = trades.filter((t) => t.symbol.toUpperCase() === symUpper);
    }

    if (query.exchange) {
      const exUpper = query.exchange.trim().toUpperCase();
      trades = trades.filter((t) => t.exchange.toUpperCase() === exUpper);
    }

    if (query.side) {
      const sideUpper = query.side.trim().toUpperCase();
      trades = trades.filter((t) => t.side.toUpperCase() === sideUpper);
    }

    if (query.from) {
      const fromDate = new Date(query.from.trim());
      if (!isNaN(fromDate.getTime())) {
        trades = trades.filter((t) => t.timestamp >= fromDate);
      }
    }

    if (query.to) {
      const rawTo = query.to.trim();
      let toDate: Date;
      // If user supplied YYYY-MM-DD, treat as end of day
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawTo)) {
        toDate = new Date(`${rawTo}T23:59:59.999Z`);
      } else {
        toDate = new Date(rawTo);
      }
      if (!isNaN(toDate.getTime())) {
        trades = trades.filter((t) => t.timestamp <= toDate);
      }
    }

    const sortDir = query.sort?.toLowerCase() === 'asc' ? 1 : -1;
    trades = [...trades].sort((a, b) => sortDir * (a.timestamp.getTime() - b.timestamp.getTime()));

    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(query.pageSize ?? '25', 10) || 25));
    const start = (page - 1) * pageSize;

    const items = trades.slice(start, start + pageSize).map(toTransactionDto);

    return {
      items,
      total: trades.length,
      page,
      pageSize,
    };
  }
}
