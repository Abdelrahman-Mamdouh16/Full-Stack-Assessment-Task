import type { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalTeardown(): Promise<void> {
  const mongo = (globalThis as typeof globalThis & { __MONGO_SERVER__?: MongoMemoryServer })
    .__MONGO_SERVER__;

  await mongo?.stop();
}
