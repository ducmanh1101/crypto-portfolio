import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import Papa from 'papaparse';
import { validateImport, validatePricesImport } from './csv-validator';
import { PortfolioStore } from '../portfolio/portfolio.service';
import { ImportResult } from '../calculation/types';

@Controller('api/import')
export class ImportController {
  constructor(private readonly store: PortfolioStore) {}

  /**
   * POST /api/import/trades — multipart upload of trades.csv.
   * Validates the ENTIRE file before touching the store: an invalid file
   * must never leave the app with a partial import (per assignment spec).
   */
  @Post('trades')
  @UseInterceptors(FileInterceptor('file'))
  async importTrades(@UploadedFile() file?: Express.Multer.File): Promise<ImportResult> {
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

  /** POST /api/import/prices — multipart upload of prices.csv. */
  @Post('prices')
  @UseInterceptors(FileInterceptor('file'))
  async importPrices(@UploadedFile() file?: Express.Multer.File): Promise<ImportResult> {
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
