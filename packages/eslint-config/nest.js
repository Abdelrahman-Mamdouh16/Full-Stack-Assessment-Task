import globals from 'globals';
import tseslint from 'typescript-eslint';
import { baseConfig } from './base.js';

export const nestConfig = tseslint.config(...baseConfig, {
  languageOptions: {
    globals: { ...globals.node, ...globals.jest },
    parserOptions: { sourceType: 'module' },
  },
  rules: {
    // Nest resolves constructor parameters and DTO metadata from the emitted
    // decorator types, so injected classes and enums must stay runtime imports.
    '@typescript-eslint/consistent-type-imports': 'off',
    // Empty interfaces are common in DTO and marker positions.
    '@typescript-eslint/no-empty-object-type': 'off',
  },
});

export default nestConfig;
