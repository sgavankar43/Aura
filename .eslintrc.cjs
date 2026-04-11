/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    // =========================================================================
    // COMPLEXITY LIMITS (from planner.md § Red Flags)
    // =========================================================================

    /** Max function length: 50 lines (planner.md red flag) */
    'max-lines-per-function': [
      'warn',
      { max: 50, skipBlankLines: true, skipComments: true },
    ],

    /** Max cyclomatic complexity */
    complexity: ['warn', { max: 10 }],

    /** Max nesting depth: 4 levels (planner.md red flag) */
    'max-depth': ['warn', { max: 4 }],

    /** Max file length to prevent god objects */
    'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],

    // =========================================================================
    // IMPORT ORDERING
    // =========================================================================
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'never',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-duplicates': 'error',

    // =========================================================================
    // TYPESCRIPT STRICTNESS
    // =========================================================================
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // =========================================================================
    // SECURITY
    // =========================================================================
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // =========================================================================
    // CODE QUALITY
    // =========================================================================
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
  },
  overrides: [
    {
      // Relax rules for test files
      files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
      rules: {
        'max-lines-per-function': 'off',
        'max-lines': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    'reports/',
    '*.config.*',
    '.dependency-cruiser.cjs',
  ],
};
