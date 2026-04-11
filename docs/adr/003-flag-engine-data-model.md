# ADR-003: Flag Engine Data Model

## Context

Aura needs a feature flag engine as its first core capability (Milestone 1). Feature flags must support:
- Multi-project isolation (tenancy)
- Per-environment overrides (dev vs staging vs production)
- Sensible defaults when no override is configured
- Soft deletes for audit trail
- Fast flag evaluation for SDK consumers

We needed to decide on:
1. The data model structure
2. How per-environment state relates to flag definitions
3. The fallback strategy when no environment-specific state exists

## Decision

Use a **normalized relational model** with four entities:

```
Project ──┬── Environment
           └── Feature ──── FlagState (per Feature × Environment)
```

- **Project**: Multi-tenant boundary. Projects are isolated — no cross-project flag access.
- **Environment**: Belongs to a Project (e.g., dev, staging, prod). Identified by a unique slug within the project.
- **Feature**: The flag definition. Has a `defaultEnabled` field as the global fallback.
- **FlagState**: The join entity between Feature and Environment. Stores the actual `enabled` boolean per-environment.

**Fallback logic**: When evaluating a flag for a given environment:
1. Look up FlagState for the (feature, environment) pair
2. If found → use `FlagState.enabled`
3. If not found → fallback to `Feature.defaultEnabled`

**ORM**: Prisma with PostgreSQL.

## Consequences

### Positive
- **Clean separation**: Flag definition (Feature) is separate from flag state (FlagState)
- **Flexible overrides**: Any environment can override any flag independently
- **Safe defaults**: `defaultEnabled` ensures flags always resolve, even for new environments
- **Audit trail**: `updatedBy` on FlagState tracks who toggled what
- **Soft deletes**: `archivedAt` on Project and Feature — flags are never truly deleted
- **Database-level integrity**: Unique constraints prevent duplicate flags/states

### Negative
- **Join required**: Flag evaluation needs a JOIN or two queries (feature + flag_state)
- **No percentage rollout**: Boolean-only for now (can extend later with a `rolloutPercentage` field)
- **No targeting rules**: No user-segment targeting yet (future milestone)

### Alternatives Considered
- **Embedded state**: Store enabled state as a JSON map on Feature (`{ "dev": true, "prod": false }`). Rejected — no referential integrity, harder to query.
- **Flat table**: Single `flags` table with environment as a column. Rejected — loses the ability to define environments as first-class entities.
- **NoSQL (MongoDB)**: Flexible schema but loses referential integrity and transactional guarantees. Rejected given we already use PostgreSQL patterns.

## Status

Accepted

## Date

2026-04-10
