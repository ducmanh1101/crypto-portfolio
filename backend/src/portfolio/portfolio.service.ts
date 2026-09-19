import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Decimal from 'decimal.js';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { DataSource, Repository } from 'typeorm';
import { computePortfolioSnapshot } from '../calculation/portfolio-calculator';
import {
  Exchange,
  HoldingDto,
  PortfolioSnapshot,
  PortfolioSnapshotDto,
  PortfolioSummaryDto,
  PricesResponseDto,
  PriceSnapshot,
  Side,
  Symbol,
  toHoldingDto,
  toSnapshotDto,
  toSummaryDto,
  Trade,
} from '../calculation/types';
import { TradeEntity } from '../database/entities/trade.entity';
import { PriceSnapshotEntity } from '../database/entities/price-snapshot.entity';
import { validateImport, validatePricesImport } from '../import/csv-validator';

export interface IPortfolioStore {
  replaceTrades(trades: Trade[]): Promise<void>;
  setPrices(prices: PriceSnapshot[]): Promise<void>;
  getTrades(): Promise<Trade[]>;
  getPrices(): Promise<PriceSnapshot[]>;
  clear(): Promise<void>;
  resetSampleData(): Promise<{ tradesImported: number; pricesImported: number }>;
}

@Injectable()
export class PortfolioStore implements IPortfolioStore, OnModuleInit {
  private readonly logger = new Logger(PortfolioStore.name);
  private memoryTrades: Trade[] = [];
  private memoryPrices: PriceSnapshot[] = [];

  constructor(
    @Optional()
    @InjectRepository(TradeEntity)
    private readonly tradeRepo?: Repository<TradeEntity>,
    @Optional()
    @InjectRepository(PriceSnapshotEntity)
    private readonly priceRepo?: Repository<PriceSnapshotEntity>,
    @Optional()
    private readonly dataSource?: DataSource,
  ) {}

  private get isDbConnected(): boolean {
    return Boolean(
      this.dataSource &&
        this.dataSource.isInitialized &&
        this.tradeRepo &&
        this.priceRepo,
    );
  }

  async onModuleInit() {
    if (this.isDbConnected) {
      this.logger.log('PortfolioStore connected to PostgreSQL');
      const count = await this.tradeRepo!.count();
      if (count === 0) {
        this.logger.log('Database is empty, auto-seeding sample data...');
        await this.resetSampleData();
      }
    } else {
      this.logger.log('PortfolioStore using in-memory storage');
      if (this.memoryTrades.length === 0) {
        await this.resetSampleData();
      }
    }
  }

  async replaceTrades(trades: Trade[]): Promise<void> {
    if (this.isDbConnected && this.dataSource) {
      await this.dataSource.transaction(async (manager) => {
        await manager.clear(TradeEntity);
        if (trades.length > 0) {
          const entities = trades.map((t) => {
            const entity = new TradeEntity();
            entity.tradeId = t.tradeId;
            entity.timestamp = t.timestamp;
            entity.exchange = t.exchange;
            entity.symbol = t.symbol;
            entity.side = t.side;
            entity.quantity = t.quantity.toString();
            entity.priceUsd = t.priceUsd.toString();
            entity.feeUsd = t.feeUsd.toString();
            return entity;
          });
          await manager.save(TradeEntity, entities, { chunk: 100 });
        }
      });
    }

    this.memoryTrades = [...trades];
  }

  async setPrices(prices: PriceSnapshot[]): Promise<void> {
    if (this.isDbConnected && this.dataSource) {
      await this.dataSource.transaction(async (manager) => {
        await manager.clear(PriceSnapshotEntity);
        if (prices.length > 0) {
          const entities = prices.map((p) => {
            const entity = new PriceSnapshotEntity();
            entity.asOf = p.asOf;
            entity.symbol = p.symbol;
            entity.priceUsd = p.priceUsd.toString();
            return entity;
          });
          await manager.save(PriceSnapshotEntity, entities);
        }
      });
    }

    this.memoryPrices = [...prices];
  }

  async getTrades(): Promise<Trade[]> {
    if (this.isDbConnected && this.tradeRepo) {
      const entities = await this.tradeRepo.find({
        order: { timestamp: 'ASC' },
      });
      return entities.map((e) => ({
        tradeId: e.tradeId,
        timestamp: new Date(e.timestamp),
        exchange: e.exchange as Exchange,
        symbol: e.symbol as Symbol,
        side: e.side as Side,
        quantity: new Decimal(e.quantity),
        priceUsd: new Decimal(e.priceUsd),
        feeUsd: new Decimal(e.feeUsd),
      }));
    }

    return [...this.memoryTrades];
  }

  async getPrices(): Promise<PriceSnapshot[]> {
    if (this.isDbConnected && this.priceRepo) {
      const entities = await this.priceRepo.find();
      return entities.map((e) => ({
        asOf: new Date(e.asOf),
        symbol: e.symbol as Symbol,
        priceUsd: new Decimal(e.priceUsd),
      }));
    }

    return [...this.memoryPrices];
  }

  async clear(): Promise<void> {
    if (this.isDbConnected && this.dataSource) {
      await this.dataSource.transaction(async (manager) => {
        await manager.clear(TradeEntity);
        await manager.clear(PriceSnapshotEntity);
      });
    }
    this.memoryTrades = [];
    this.memoryPrices = [];
  }

  async resetSampleData(): Promise<{ tradesImported: number; pricesImported: number }> {
    const candidatePaths = [
      path.resolve(process.cwd(), '../data'),
      path.resolve(process.cwd(), 'data'),
      path.resolve(__dirname, '../../../data'),
    ];

    let tradesFile: string | null = null;
    let pricesFile: string | null = null;

    for (const p of candidatePaths) {
      const fullTrades = path.join(p, 'trades.csv');
      const sampleTrades = path.join(p, 'trades.sample.csv');
      if (!tradesFile) {
        if (fs.existsSync(fullTrades)) tradesFile = fullTrades;
        else if (fs.existsSync(sampleTrades)) tradesFile = sampleTrades;
      }

      const fullPrices = path.join(p, 'prices.csv');
      const samplePrices = path.join(p, 'prices.sample.csv');
      if (!pricesFile) {
        if (fs.existsSync(fullPrices)) pricesFile = fullPrices;
        else if (fs.existsSync(samplePrices)) pricesFile = samplePrices;
      }
    }

    let tradesImported = 0;
    let pricesImported = 0;

    if (tradesFile && fs.existsSync(tradesFile)) {
      const content = fs.readFileSync(tradesFile, 'utf-8');
      const parsed = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true });
      const validation = validateImport(parsed.meta.fields ?? [], parsed.data);
      if (validation.valid) {
        await this.replaceTrades(validation.trades);
        tradesImported = validation.trades.length;
        this.logger.log(`Loaded ${tradesImported} trades from ${tradesFile}`);
      } else {
        this.logger.warn(`Failed to validate trades from ${tradesFile}: ${JSON.stringify(validation.errors)}`);
      }
    }

    if (pricesFile && fs.existsSync(pricesFile)) {
      const content = fs.readFileSync(pricesFile, 'utf-8');
      const parsed = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true });
      const validation = validatePricesImport(parsed.meta.fields ?? [], parsed.data);
      if (validation.valid) {
        await this.setPrices(validation.prices);
        pricesImported = validation.prices.length;
        this.logger.log(`Loaded ${pricesImported} prices from ${pricesFile}`);
      } else {
        this.logger.warn(`Failed to validate prices from ${pricesFile}: ${JSON.stringify(validation.errors)}`);
      }
    }

    return { tradesImported, pricesImported };
  }
}

@Injectable()
export class PortfolioService {
  constructor(private readonly store: PortfolioStore) {}

  async getRawSnapshot(): Promise<PortfolioSnapshot> {
    const [trades, prices] = await Promise.all([this.store.getTrades(), this.store.getPrices()]);
    return computePortfolioSnapshot(trades, prices);
  }

  async getSnapshot(): Promise<PortfolioSnapshotDto> {
    const raw = await this.getRawSnapshot();
    return toSnapshotDto(raw);
  }

  async getSummary(): Promise<PortfolioSummaryDto> {
    const raw = await this.getRawSnapshot();
    return toSummaryDto(raw.summary);
  }

  async getHoldings(): Promise<HoldingDto[]> {
    const raw = await this.getRawSnapshot();
    return raw.positions.map(toHoldingDto);
  }

  async getPrices(): Promise<PricesResponseDto> {
    const prices = await this.store.getPrices();
    const asOf = prices.length > 0 ? prices[0].asOf.toISOString() : null;
    return {
      asOf,
      prices: prices.map((p) => ({
        asOf: p.asOf.toISOString(),
        symbol: p.symbol,
        priceUsd: p.priceUsd.toString(),
      })),
    };
  }

  async resetSampleData() {
    return this.store.resetSampleData();
  }
}
