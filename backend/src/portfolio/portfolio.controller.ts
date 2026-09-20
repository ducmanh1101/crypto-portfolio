import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import {
  HoldingDto,
  PortfolioSnapshotDto,
  PortfolioSummaryDto,
  PricesResponseDto,
  ResetResultDto,
} from '../dto/api.dto';

@ApiTags('Portfolio & Analytics')
@Controller('api')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('portfolio')
  @ApiOperation({
    summary: 'Get full portfolio snapshot',
    description: 'Returns aggregate summary metrics (total value, cost basis, realized/unrealized P&L, fees) and individual holdings per asset, computed fresh from the trade history.',
  })
  @ApiResponse({ status: 200, description: 'Portfolio snapshot returned successfully', type: PortfolioSnapshotDto })
  async getSnapshot(): Promise<PortfolioSnapshotDto> {
    return this.portfolioService.getSnapshot();
  }

  @Get('portfolio/summary')
  @ApiOperation({
    summary: 'Get portfolio summary metrics only',
    description: 'Returns high-level cards metrics (currentValue, currentCostBasis, realizedPnl, unrealizedPnl, totalPnl, totalFeesPaid, pricesAsOf).',
  })
  @ApiResponse({ status: 200, description: 'Portfolio summary returned successfully', type: PortfolioSummaryDto })
  async getSummary(): Promise<PortfolioSummaryDto> {
    return this.portfolioService.getSummary();
  }

  @Get('portfolio/holdings')
  @ApiOperation({
    summary: 'Get current asset holdings',
    description: 'Returns array of current positions per asset with average cost, quantity held, market value, P&L, and portfolio allocation percentage.',
  })
  @ApiResponse({ status: 200, description: 'Holdings list returned successfully', type: [HoldingDto] })
  async getHoldings(): Promise<HoldingDto[]> {
    return this.portfolioService.getHoldings();
  }

  @Get(['portfolio/prices', 'prices'])
  @ApiOperation({
    summary: 'Get current price snapshot',
    description: 'Returns latest market prices from prices.csv and the as_of timestamp.',
  })
  @ApiResponse({ status: 200, description: 'Prices snapshot returned successfully', type: PricesResponseDto })
  async getPrices(): Promise<PricesResponseDto> {
    return this.portfolioService.getPrices();
  }

  @Post(['portfolio/reset', 'data/reset'])
  @ApiOperation({
    summary: 'Reset dataset to sample files',
    description: 'Clears current database and re-seeds initial data from data/trades.csv and data/prices.csv.',
  })
  @ApiResponse({ status: 200, description: 'Portfolio reset successfully', type: ResetResultDto })
  async resetData(): Promise<ResetResultDto> {
    const result = await this.portfolioService.resetSampleData();
    return {
      message: 'Portfolio data reset successfully',
      ...result,
    };
  }
}
