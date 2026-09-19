import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { isPostgresListening } from './database/postgres-check';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  if (process.env.USE_POSTGRES !== 'false') {
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || '5432', 10);
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

  const appPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(appPort);
  logger.log(`Backend is running on: http://localhost:${appPort}`);
}
bootstrap();
