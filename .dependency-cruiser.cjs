/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // =========================================================================
    // LAYERED ARCHITECTURE BOUNDARIES
    // Routes → Controllers → Services → Repositories → Models
    // =========================================================================
    {
      name: 'no-routes-to-repositories',
      comment: 'Routes must not import directly from repositories. Use controllers/services.',
      severity: 'error',
      from: { path: '^Server/src/routes' },
      to: { path: '^Server/src/repositories' },
    },
    {
      name: 'no-routes-to-services',
      comment: 'Routes must not import directly from services. Use controllers.',
      severity: 'error',
      from: { path: '^Server/src/routes' },
      to: { path: '^Server/src/services' },
    },
    {
      name: 'no-controllers-to-repositories',
      comment: 'Controllers must not import directly from repositories. Use services.',
      severity: 'error',
      from: { path: '^Server/src/controllers' },
      to: { path: '^Server/src/repositories' },
    },

    // =========================================================================
    // NO CIRCULAR DEPENDENCIES
    // =========================================================================
    {
      name: 'no-circular',
      comment: 'Circular dependencies create tight coupling and make testing difficult.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },

    // =========================================================================
    // NO ORPHANS (unreachable modules)
    // =========================================================================
    {
      name: 'no-orphans',
      comment: 'Modules that are not reachable from any entry point should be removed.',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '\\.(test|spec)\\.ts$',
          '__tests__',
          '\\.gitkeep$',
          'setup\\.ts$',
        ],
      },
      to: {},
    },

    // =========================================================================
    // NO DEV DEPENDENCIES IN PRODUCTION CODE
    // =========================================================================
    {
      name: 'no-dev-deps-in-src',
      comment: 'Production code should not depend on devDependencies.',
      severity: 'error',
      from: {
        path: '^Server/src',
        pathNot: '\\.(test|spec)\\.ts$',
      },
      to: {
        dependencyTypes: ['npm-dev'],
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: false,
    tsConfig: {
      fileName: 'tsconfig.base.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    reporterOptions: {
      dot: {
        theme: {
          graph: { rankdir: 'LR' },
        },
      },
    },
  },
};
