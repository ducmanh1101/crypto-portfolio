import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import Papa from 'papaparse';
import { validateImport, validatePricesImport } from './csv-validator';
import { PortfolioStore } from '../portfolio/portfolio.service';
import {
  FileUploadDto,
  ImportErrorResponseDto,
  ImportResultDto,
} from '../dto/api.dto';

@ApiTags('CSV Import & Management')
@Controller('api/import')
export class ImportController {
  constructor(private readonly store: PortfolioStore) {}

  @Post('trades')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Import / Re-import trades CSV',
    description: 'Upload a multipart trades.csv file. Validates the entire file (columns, data types, ranges, duplicates, short positions) before atomic replacement in the database.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file with trades data (trade_id, timestamp, exchange, symbol, side, quantity, price_usd, fee_usd)',
    type: FileUploadDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Trades imported successfully',
    type: ImportResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed. No partial state saved (atomic rejection).',
    type: ImportErrorResponseDto,
  })
  async importTrades(@UploadedFile() file?: Express.Multer.File): Promise<ImportResultDto> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded');
    }

    const parsed = Papa.parse<Record<string, string>>(file.buffer.toString('utf-8'), {
      header: true,
      skipEmptyLines: true,
    });

    const header = parsed.meta.fields ?? [];
    const result = validateImport(header, parsed.data);

    if (!result.valid) {
      throw new BadRequestException({ message: 'Import failed validation', errors: result.errors });
    }

    // Only mutate the store once the whole file is known-good → atomic replace.
    await this.store.replaceTrades(result.trades);

    return { imported: result.trades.length };
  }

  @Post('prices')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Import / Re-import prices CSV',
    description: 'Upload a multipart prices.csv file (as_of, symbol, price_usd). Atomically updates stored price snapshot.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file with price snapshot data (as_of, symbol, price_usd)',
    type: FileUploadDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Prices imported successfully',
    type: ImportResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed. No partial state saved.',
    type: ImportErrorResponseDto,
  })
  async importPrices(@UploadedFile() file?: Express.Multer.File): Promise<ImportResultDto> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded');
    }

    const parsed = Papa.parse<Record<string, string>>(file.buffer.toString('utf-8'), {
      header: true,
      skipEmptyLines: true,
    });

    const header = parsed.meta.fields ?? [];
    const result = validatePricesImport(header, parsed.data);

    if (!result.valid) {
      throw new BadRequestException({ message: 'Import failed validation', errors: result.errors });
    }

    await this.store.setPrices(result.prices);
    return { imported: result.prices.length };
  }
}
