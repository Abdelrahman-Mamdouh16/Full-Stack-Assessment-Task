import { MongoMemoryServer } from 'mongodb-memory-server';

/** Boots an in-memory MongoDB so the suite never touches a developer's database. */
export default async function globalSetup(): Promise<void> {
  const mongo = await MongoMemoryServer.create();

  (globalThis as typeof globalThis & { __MONGO_SERVER__?: MongoMemoryServer }).__MONGO_SERVER__ =
    mongo;

  process.env.MONGODB_URI = mongo.getUri('projectflow_test');
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.API_PORT = '4733';
}
