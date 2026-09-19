import { Controller, Get, Post } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import {
  HoldingDto,
  PortfolioSnapshotDto,
  PortfolioSummaryDto,
  PricesResponseDto,
} from '../calculation/types';

@Controller('api')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  /** GET /api/portfolio — dashboard summary + per-asset holdings */
  @Get('portfolio')
  async getSnapshot(): Promise<PortfolioSnapshotDto> {
    return this.portfolioService.getSnapshot();
  }

  /** GET /api/portfolio/summary — dashboard summary cards only */
  @Get('portfolio/summary')
  async getSummary(): Promise<PortfolioSummaryDto> {
    return this.portfolioService.getSummary();
  }

  /** GET /api/portfolio/holdings — per-asset holdings list only */
  @Get('portfolio/holdings')
  async getHoldings(): Promise<HoldingDto[]> {
    return this.portfolioService.getHoldings();
  }

  /** GET /api/portfolio/prices and GET /api/prices — current price snapshot and as-of date */
  @Get(['portfolio/prices', 'prices'])
  async getPrices(): Promise<PricesResponseDto> {
    return this.portfolioService.getPrices();
  }

  /** POST /api/portfolio/reset — reset and re-seed from sample data */
  @Post(['portfolio/reset', 'data/reset'])
  async resetData() {
    const result = await this.portfolioService.resetSampleData();
    return {
      message: 'Portfolio data reset successfully',
      ...result,
    };
  }
}
