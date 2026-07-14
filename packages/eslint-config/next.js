import globals from 'globals';
import tseslint from 'typescript-eslint';
import nextPlugin from 'eslint-config-next';
import { baseConfig } from './base.js';

export const nextConfig = tseslint.config(...baseConfig, ...nextPlugin, {
  languageOptions: {
    globals: { ...globals.browser, ...globals.node },
  },
});

export default nextConfig;
