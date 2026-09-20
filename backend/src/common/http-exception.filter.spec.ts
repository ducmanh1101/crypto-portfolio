import { HttpStatus, HttpException } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  it('formats HttpException with status, timestamp, path and message', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/api/test', method: 'GET' }),
      }),
    } as any;

    const exception = new HttpException('Forbidden resource', HttpStatus.FORBIDDEN);
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        path: '/api/test',
        message: 'Forbidden resource',
        timestamp: expect.any(String),
      }),
    );
  });

  it('formats structured validation errors when response is an object', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/api/import/trades', method: 'POST' }),
      }),
    } as any;

    const validationErrors = [{ row: 1, field: 'symbol', message: 'Unsupported symbol' }];
    const exception = new HttpException(
      { message: 'Import failed validation', errors: validationErrors },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: '/api/import/trades',
        message: 'Import failed validation',
        errors: validationErrors,
      }),
    );
  });

  it('handles standard unhandled Error with 500 status', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/api/crash', method: 'GET' }),
      }),
    } as any;

    const error = new Error('Database connection reset');
    filter.catch(error, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        path: '/api/crash',
        message: 'Database connection reset',
      }),
    );
  });
});

