import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { PortfolioController } from './portfolio/portfolio.controller';
import { PortfolioService, PortfolioStore } from './portfolio/portfolio.service';
import { ImportController } from './import/import.controller';
import { TradesController } from './trades/trades.controller';
import { TradeEntity } from './database/entities/trade.entity';
import { PriceSnapshotEntity } from './database/entities/price-snapshot.entity';

dotenv.config();

const usePostgres = process.env.USE_POSTGRES !== 'false' && process.env.NODE_ENV !== 'test';

const dbImports: (DynamicModule | Promise<DynamicModule>)[] = usePostgres
  ? [
      TypeOrmModule.forRoot({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgrespassword',
        database: process.env.DB_DATABASE || 'crypto_portfolio',
        entities: [TradeEntity, PriceSnapshotEntity],
        synchronize: true,
        autoLoadEntities: true,
        retryAttempts: 3,
        retryDelay: 1500,
      }),
      TypeOrmModule.forFeature([TradeEntity, PriceSnapshotEntity]),
    ]
  : [];

@Module({
  imports: [...dbImports],
  controllers: [PortfolioController, ImportController, TradesController],
  providers: [PortfolioStore, PortfolioService],
  exports: [PortfolioStore, PortfolioService],
})
export class AppModule {}
