import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import type { NextConfig } from 'next';

// Configuration lives in a single .env file at the repository root.
loadEnv({ path: resolve(process.cwd(), '../../.env'), quiet: true });

const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: true,
  transpilePackages: ['@projectflow/shared'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4732',
  },
};

export default nextConfig;
