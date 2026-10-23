import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // Ignore patterns
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'reports/**',
      'stryker-tmp/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
    ],
  },

  // Base recommended configs
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,

  // TypeScript files configuration
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-base-to-string': 'off', // Allow intentional string conversion in error handling
      '@typescript-eslint/no-redundant-type-constituents': 'off', // Allow intentional union types for API clarity
      '@typescript-eslint/no-unsafe-assignment': 'off', // Allow spreading unknown types for flexible subject handling

      // General code quality
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
    },
  },

  // Test files configuration
  {
    files: ['**/*.test.ts', 'src/testHelpers.ts'],
    rules: {
      // Allow any in test files for mocking
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow unused expressions in tests (for expect statements)
      '@typescript-eslint/no-unused-expressions': 'off',
      // Allow non-null assertions in tests
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Allow unsafe operations in tests for testing dynamic behavior
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      // Allow unnecessary type assertions in tests
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      // Allow logical OR instead of nullish coalescing in tests
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },
);
