# Aura — Distributed Systems Platform

A distributed systems platform built with an **AI-Agent driven development workflow** that enforces TDD, architectural integrity, and automated security auditing.

## Architecture

```
Aura/
├── .gemini/                    # AI Agent personas
│   ├── planner.md              # Feature planning specialist
│   ├── architect.md            # System design specialist
│   ├── security-auditor.md     # Security review specialist
│   ├── tdd-enforcer.md         # TDD discipline enforcer
│   └── settings.json           # Agent configuration
├── .github/workflows/          # CI/CD pipelines
│   ├── ci.yml                  # Main CI (lint, test, arch, security)
│   └── security-weekly.yml     # Weekly security scan
├── Client/                     # React + Vite frontend
│   └── src/
├── Server/                     # Express + TypeScript backend
│   └── src/
│       ├── controllers/        # HTTP request/response handling
│       ├── services/           # Business logic
│       ├── repositories/       # Data access abstraction
│       ├── models/             # Types, schemas, interfaces
│       ├── middleware/         # Request pipeline (security, validation, etc.)
│       ├── routes/            # HTTP endpoint mapping
│       ├── utils/             # Shared utilities
│       ├── config/            # App configuration
│       └── __tests__/         # Test files (mirrors src structure)
├── docs/adr/                  # Architecture Decision Records
├── scripts/                   # Automation scripts
│   ├── tdd-check.sh           # Test coverage validation
│   ├── check-architecture.sh  # Boundary enforcement
│   └── security-audit.sh      # Security scanning
└── reports/                   # Generated reports (gitignored)
```

## Server Layer Architecture

```
Routes → Controllers → Services → Repositories → Models
  │           │             │            │            │
  │  HTTP     │  Request    │  Business  │   Data     │  Types &
  │  mapping  │  handling   │  logic     │   access   │  schemas
```

**Dependency direction is enforced** by:
- dependency-cruiser (CI)
- ESLint import rules
- Architecture check script
- Pre-commit hooks

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start development servers
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Full validation (lint + arch + security + tests)
npm run validate:all
```

## Development Workflow

### AI-Agent Driven Process

Every feature follows this workflow:

1. **🗓️ Planner** → Creates implementation plan with phases, risks, and testing strategy
2. **🏗️ Architect** → Reviews architectural impact, creates ADRs for significant decisions
3. **🧪 TDD Enforcer** → Write tests FIRST (Red → Green → Refactor)
4. **💻 Implementation** → Write code to pass tests
5. **🔒 Security Auditor** → Reviews for OWASP vulnerabilities
6. **🤖 CI Pipeline** → Automated validation gates

### Quality Gates

| Gate | Tool | Threshold |
|------|------|-----------|
| Test Coverage | Vitest + v8 | ≥80% branches/functions/lines |
| Architecture | dependency-cruiser | Zero boundary violations |
| Code Complexity | ESLint | Max 50 lines/function, 4 levels nesting |
| Security | Semgrep + custom | No critical/high findings |
| Secrets | Gitleaks | Zero detected secrets |
| Dependencies | npm audit | No high/critical vulnerabilities |

### Available Scripts

```bash
# Development
npm run dev              # Start both client and server
npm run dev:server       # Start server only
npm run dev:client       # Start client only

# Testing
npm test                 # Run all tests
npm run test:coverage    # Run tests with coverage report
npm run tdd:check        # Check test file coverage

# Quality
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format
npm run format:check     # Prettier check

# Architecture
npm run check:architecture  # Validate boundaries and structure

# Security
npm run audit:security   # Full security audit

# All-in-one
npm run validate:all     # Run everything
```

## Architecture Decision Records

All significant architectural decisions are documented in [`docs/adr/`](docs/adr/):

| ADR | Title | Status |
|-----|-------|--------|
| [001](docs/adr/001-monorepo-structure.md) | Monorepo with npm Workspaces | Accepted |
| [002](docs/adr/002-layered-server-architecture.md) | Layered Server Architecture | Accepted |

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript (strict mode)
- **Server**: Express
- **Client**: React + Vite
- **Testing**: Vitest + Supertest + React Testing Library
- **Linting**: ESLint + Prettier
- **Security**: Helmet, Zod, Semgrep, Gitleaks
- **CI/CD**: GitHub Actions
- **Architecture**: dependency-cruiser

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development guide.
