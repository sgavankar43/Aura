# Contributing to Aura

Welcome! This guide explains the AI-Agent driven development workflow used in Aura.

## Development Setup

```bash
# Prerequisites: Node.js 20+
node --version  # Should be 20.x or later

# Clone and install
git clone <repository-url>
cd Aura
npm install
cp .env.example .env

# Verify everything works
npm run validate:all
```

## The AI-Agent Workflow

Every feature or significant change follows this process:

### Step 1: Plan (Planner Agent)

Before writing any code, create an implementation plan:

1. Describe the feature requirements
2. Identify affected architectural layers
3. Break into phases (each independently mergeable)
4. Define testing strategy
5. Identify risks and mitigations

Reference: `.gemini/planner.md`

### Step 2: Architecture Review (Architect Agent)

For changes that touch multiple layers or introduce new patterns:

1. Evaluate architectural impact
2. Check for boundary violations
3. Create an ADR in `docs/adr/` if the decision is significant
4. Document trade-offs

Reference: `.gemini/architect.md`

### Step 3: Write Tests First (TDD Enforcer)

**Tests MUST be written BEFORE implementation code.**

```
Red → Green → Refactor

1. Write a failing test (Red)
2. Write minimal code to pass (Green)
3. Refactor while keeping tests green
```

Test file location mirrors source:
```
Source:  Server/src/middleware/auth.ts
Test:    Server/src/__tests__/middleware/auth.test.ts
```

Coverage threshold: **80% minimum** (branches, functions, lines, statements).

Reference: `.gemini/tdd-enforcer.md`

### Step 4: Implement

Write code that:
- Passes all tests
- Follows the layered architecture (Routes → Controllers → Services → Repositories)
- Stays under complexity limits (50 lines/function, 4 levels nesting)
- Uses Zod for input validation at boundaries

### Step 5: Security Review (Security Auditor)

Before merging, validate:
- No hardcoded secrets
- Input validation on all endpoints
- Proper error handling (no information leakage)
- Dependencies are clean (`npm audit`)
- OWASP Top 10 checklist reviewed

Reference: `.gemini/security-auditor.md`

### Step 6: CI Validation

Push your branch. CI automatically runs:
1. ESLint + Prettier
2. All tests with coverage gate
3. Architecture boundary validation
4. Security audit

**All checks must pass before merge.**

## Architecture Rules

### Layer Boundaries (ENFORCED IN CI)

```
Layer           | Can Import From
----------------|----------------------------------
Routes          | Controllers, Middleware
Controllers     | Services, Models
Services        | Repositories, Models, Utils
Repositories    | Models, Utils
Models          | (nothing internal)
Middleware      | Utils, Config
Utils           | (nothing internal)
Config          | (nothing internal)
```

**Violations are caught by:**
- dependency-cruiser (CI)
- Pre-commit hooks
- Architecture check script

### File Size Limits

- **Functions**: Max 50 lines (ESLint warning)
- **Files**: Max 300 lines (ESLint warning)
- **Nesting**: Max 4 levels (ESLint warning)
- **Cyclomatic complexity**: Max 10 (ESLint warning)

## Architecture Decision Records (ADRs)

For significant decisions:

1. Copy `docs/adr/template.md`
2. Name: `docs/adr/XXX-title.md`
3. Fill in Context, Decision, Consequences, Alternatives
4. Submit for review with the PR

## Security Checklist for PRs

Before submitting a PR, verify:

- [ ] No hardcoded secrets (passwords, API keys, tokens)
- [ ] All user input validated with Zod schemas
- [ ] Error responses don't leak implementation details
- [ ] No `eval()`, `new Function()`, or `exec()` usage
- [ ] No `innerHTML` without sanitization
- [ ] `npm audit` has no high/critical vulnerabilities
- [ ] Sensitive fields redacted in logging
- [ ] Authentication/authorization checks on protected routes

## Useful Commands

```bash
# Check if your changes violate architecture
npm run check:architecture

# Run security audit
npm run audit:security

# Check test coverage
npm run test:coverage

# Check for untested files
npm run tdd:check

# Validate everything at once
npm run validate:all
```
