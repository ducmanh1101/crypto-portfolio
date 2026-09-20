import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exchange, Side, Symbol } from '../calculation/types';

export class PortfolioSummaryDto {
  @ApiProperty({ description: 'Total current market valuation of the portfolio in USD', example: '60620.89161' })
  currentValue!: string;

  @ApiProperty({ description: 'Total cost basis of all currently held assets in USD', example: '59969.237419301033835' })
  currentCostBasis!: string;

  @ApiProperty({ description: 'Cumulative realized profit & loss from all historical SELL transactions', example: '-5052.9626879454661673' })
  realizedPnl!: string;

  @ApiProperty({ description: 'Current unrealized profit & loss on open positions in USD', example: '651.6541906989661648' })
  unrealizedPnl!: string;

  @ApiProperty({ description: 'Total P&L (realized + unrealized) in USD', example: '-4401.3084972465000025' })
  totalPnl!: string;

  @ApiProperty({ description: 'Total cumulative fees paid across all BUY and SELL transactions in USD', example: '2708.86' })
  totalFeesPaid!: string;

  @ApiPropertyOptional({ description: 'UTC timestamp of the current price snapshot', example: '2026-03-31T23:59:59.000Z', nullable: true })
  pricesAsOf!: string | null;
}

export class HoldingDto {
  @ApiProperty({ description: 'Asset symbol', enum: ['BTC', 'ETH', 'SOL', 'CKB', 'DOGE'], example: 'BTC' })
  symbol!: Symbol;

  @ApiProperty({ description: 'Quantity of units currently held', example: '0.0774292' })
  quantityHeld!: string;

  @ApiProperty({ description: 'Weighted-average purchase cost per unit in USD (includes capitalized BUY fees)', example: '117711.89990106209051' })
  averageCost!: string;

  @ApiProperty({ description: 'Current market price in USD from prices.csv', example: '111500' })
  currentPrice!: string;

  @ApiProperty({ description: 'Current cost basis of held units in USD', example: '9114.3382398193168182' })
  currentCostBasis!: string;

  @ApiProperty({ description: 'Current market value in USD (quantityHeld * currentPrice)', example: '8633.3558' })
  currentValue!: string;

  @ApiProperty({ description: 'Cumulative realized P&L across all closed/partially closed positions', example: '-463.7459753271831822' })
  realizedPnl!: string;

  @ApiProperty({ description: 'Unrealized P&L (currentValue - currentCostBasis)', example: '-480.9824398193168182' })
  unrealizedPnl!: string;

  @ApiProperty({ description: 'Total P&L (realized + unrealized)', example: '-944.7284151465000004' })
  totalPnl!: string;

  @ApiProperty({ description: 'Allocation percentage of total portfolio value (0.0 to 1.0)', example: '0.14241551997522657354' })
  allocationPct!: string;

  @ApiProperty({ description: 'Total BUY + SELL fees paid for this asset', example: '486.42' })
  totalFeesPaid!: string;
}

export class PortfolioSnapshotDto {
  @ApiProperty({ type: PortfolioSummaryDto, description: 'Aggregate portfolio metrics' })
  summary!: PortfolioSummaryDto;

  @ApiProperty({ type: [HoldingDto], description: 'List of positions / holdings per asset' })
  positions!: HoldingDto[];
}

export class PriceSnapshotDto {
  @ApiProperty({ description: 'UTC timestamp when the price was recorded', example: '2026-03-31T23:59:59.000Z' })
  asOf!: string;

  @ApiProperty({ description: 'Asset symbol', enum: ['BTC', 'ETH', 'SOL', 'CKB', 'DOGE'], example: 'BTC' })
  symbol!: Symbol;

  @ApiProperty({ description: 'Price in USD', example: '111500.00' })
  priceUsd!: string;
}

export class PricesResponseDto {
  @ApiPropertyOptional({ description: 'Snapshot timestamp', example: '2026-03-31T23:59:59.000Z', nullable: true })
  asOf!: string | null;

  @ApiProperty({ type: [PriceSnapshotDto], description: 'Current price list by symbol' })
  prices!: PriceSnapshotDto[];
}

export class TransactionDto {
  @ApiProperty({ description: 'Unique trade identifier', example: 'TRD-0001' })
  tradeId!: string;

  @ApiProperty({ description: 'Transaction timestamp in UTC ISO-8601', example: '2025-10-01T09:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ description: 'Exchange where the trade was executed', enum: ['Binance', 'Coinbase'], example: 'Binance' })
  exchange!: Exchange;

  @ApiProperty({ description: 'Asset symbol', enum: ['BTC', 'ETH', 'SOL', 'CKB', 'DOGE'], example: 'BTC' })
  symbol!: Symbol;

  @ApiProperty({ description: 'Trade side', enum: ['BUY', 'SELL'], example: 'BUY' })
  side!: Side;

  @ApiProperty({ description: 'Trade quantity', example: '0.03141403' })
  quantity!: string;

  @ApiProperty({ description: 'Execution price per unit in USD', example: '105507.74' })
  priceUsd!: string;

  @ApiProperty({ description: 'Fee paid in USD', example: '3.31' })
  feeUsd!: string;

  @ApiProperty({ description: 'Gross trade value (quantity * priceUsd) in USD', example: '3314.4233095922' })
  grossValueUsd!: string;
}

export class PaginatedTransactionsDto {
  @ApiProperty({ type: [TransactionDto], description: 'Page items' })
  items!: TransactionDto[];

  @ApiProperty({ description: 'Total count of trades matching filter criteria', example: 200 })
  total!: number;

  @ApiProperty({ description: 'Current page number (1-based)', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Page size limit', example: 25 })
  pageSize!: number;
}

export class ImportResultDto {
  @ApiProperty({ description: 'Number of rows successfully imported and saved', example: 200 })
  imported!: number;
}

export class ResetResultDto {
  @ApiProperty({ description: 'Status message', example: 'Portfolio data reset successfully' })
  message!: string;

  @ApiProperty({ description: 'Number of trades reloaded', example: 200 })
  tradesImported!: number;

  @ApiProperty({ description: 'Number of prices reloaded', example: 5 })
  pricesImported!: number;
}

export class ValidationErrorDto {
  @ApiProperty({ description: 'Row index in CSV file (1-based, or 0 for header, -1 for cross-row)', example: 5 })
  row!: number;

  @ApiPropertyOptional({ description: 'Name of the invalid column/field', example: 'quantity' })
  field?: string;

  @ApiProperty({ description: 'Actionable error description', example: 'quantity must be greater than zero' })
  message!: string;
}

export class ImportErrorResponseDto {
  @ApiProperty({ description: 'Error summary message', example: 'Import failed validation' })
  message!: string;

  @ApiProperty({ type: [ValidationErrorDto], description: 'List of specific validation errors found in the CSV' })
  errors!: ValidationErrorDto[];
}

export class TradesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by symbol (case-insensitive)', enum: ['BTC', 'ETH', 'SOL', 'CKB', 'DOGE'] })
  symbol?: string;

  @ApiPropertyOptional({ description: 'Filter by exchange (case-insensitive)', enum: ['Binance', 'Coinbase'] })
  exchange?: string;

  @ApiPropertyOptional({ description: 'Filter by side (case-insensitive)', enum: ['BUY', 'SELL'] })
  side?: string;

  @ApiPropertyOptional({ description: 'Start date in ISO format (e.g. 2025-10-01)', example: '2025-10-01' })
  from?: string;

  @ApiPropertyOptional({ description: 'End date in ISO format (e.g. 2026-03-31)', example: '2026-03-31' })
  to?: string;

  @ApiPropertyOptional({ description: 'Sort by timestamp', enum: ['asc', 'desc'], default: 'desc' })
  sort?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: '1' })
  page?: string;

  @ApiPropertyOptional({ description: 'Items per page (max 200)', default: '25' })
  pageSize?: string;
}

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'CSV file to upload' })
  file!: any;
}

