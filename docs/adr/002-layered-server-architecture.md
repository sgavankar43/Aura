# ADR-002: Layered Server Architecture

## Context

The server needs a clear, maintainable structure that enforces separation of concerns, enables testing, and scales with the team. We need to prevent common anti-patterns like business logic in route handlers or direct database access from controllers.

## Decision

Adopt a **layered architecture** with strict dependency direction:

```
Routes → Controllers → Services → Repositories → Models
```

- **Routes**: HTTP endpoint mapping only. No logic.
- **Controllers**: HTTP request/response handling. Parses input, calls services, formats output.
- **Services**: Business logic. Orchestrates operations, enforces rules.
- **Repositories**: Data access abstraction. Queries, mutations, caching.
- **Models**: Data structures, types, Zod schemas. Imported by any layer.

**Enforcement**: Import boundaries are validated by dependency-cruiser in CI and the architecture check script.

## Consequences

### Positive
- **Testability**: Each layer can be tested in isolation with mocks
- **Maintainability**: Clear ownership — developers know where code belongs
- **Flexibility**: Swapping databases only requires changing repositories
- **Onboarding**: New developers understand the structure immediately
- **Automated enforcement**: CI catches violations before merge

### Negative
- **Boilerplate**: Simple CRUD operations require touching multiple files
- **Indirection**: Following a request through layers requires jumping between files
- **Over-engineering risk**: For very simple features, layers add overhead

### Alternatives Considered
- **MVC**: Simpler but doesn't separate data access from business logic. Rejected for lack of testability.
- **Clean Architecture / Hexagonal**: More principled but heavier. Deferred for potential future migration when domain complexity warrants it.
- **No structure (convention-free)**: Fast initially but becomes unmaintainable. Rejected.

## Status

Accepted

## Date

2026-04-10
