import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import type { Connection } from 'mongoose';
import { AppModule } from '../../src/app.module';

export interface TestContext {
  app: INestApplication;
  connection: Connection;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();

  return { app, connection: app.get<Connection>(getConnectionToken()) };
}

export async function resetDatabase(connection: Connection): Promise<void> {
  const collections = await connection.db!.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}
