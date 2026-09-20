import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { isPostgresListening } from './database/postgres-check';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  if (process.env.USE_POSTGRES !== 'false') {
    let host = process.env.DB_HOST || 'localhost';
    let port = parseInt(process.env.DB_PORT || '5432', 10);
    if (process.env.DATABASE_URL && !process.env.DB_HOST) {
      try {
        const parsed = new URL(process.env.DATABASE_URL);
        host = parsed.hostname;
        port = parseInt(parsed.port || '5432', 10);
      } catch {}
    }
    const reachable = await isPostgresListening(host, port);

    if (reachable) {
      logger.log(`PostgreSQL is reachable at ${host}:${port}. Enabling TypeORM persistence.`);
    } else {
      logger.warn(
        `PostgreSQL is NOT reachable at ${host}:${port}. Falling back to in-memory store. ` +
        `Run 'docker-compose up -d' or start local PostgreSQL to enable persistent storage.`,
      );
      process.env.USE_POSTGRES = 'false';
    }
  } else {
    logger.log('USE_POSTGRES is set to false. Running in-memory mode.');
  }

  // Dynamic import of AppModule so it reads the updated process.env.USE_POSTGRES
  const { AppModule } = await import('./app.module');
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Crypto Portfolio Analytics API')
    .setDescription(
      'Interactive OpenAPI / Swagger specification for Crypto Portfolio Analytics, Holdings, and Transaction Explorer.',
    )
    .setVersion('1.0.0')
    .addTag('Portfolio & Analytics', 'Portfolio summary, holding valuations, price snapshots, and dataset reset')
    .addTag('Transaction Explorer', 'Query, filter, sort, and paginate historical trades')
    .addTag('CSV Import & Management', 'Upload and atomically validate trades.csv and prices.csv files')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Crypto Portfolio API Documentation',
  });

  // Export static swagger.json to disk for frontend integration
  try {
    const swaggerJson = JSON.stringify(document, null, 2);
    fs.writeFileSync(path.resolve(process.cwd(), 'swagger.json'), swaggerJson);
    const rootPath = path.resolve(process.cwd(), '../swagger.json');
    fs.writeFileSync(rootPath, swaggerJson);
    logger.log(`Generated OpenAPI spec at swagger.json`);
  } catch (err) {
    logger.warn(`Could not export swagger.json: ${err}`);
  }

  const appPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(appPort, '0.0.0.0');
  logger.log(`Backend is running on: http://0.0.0.0:${appPort}`);
  logger.log(`Swagger UI is available at: http://localhost:${appPort}/api/docs`);
  logger.log(`Swagger JSON is available at: http://localhost:${appPort}/api/docs-json`);
}
bootstrap();
