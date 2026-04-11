# ADR-001: Monorepo with npm Workspaces

## Context

Aura is a distributed systems platform with separate Client and Server components. We needed to decide between a monorepo (single repository) or polyrepo (multiple repositories) structure, and which monorepo tool to use.

## Decision

Use a **monorepo with npm workspaces** — a single repository containing both `Client/` and `Server/` as workspace packages.

## Consequences

### Positive
- **Atomic commits**: Changes spanning client and server can be a single commit
- **Shared tooling**: ESLint, Prettier, TypeScript configs are centralized
- **Simplified CI/CD**: One pipeline validates everything
- **Easy cross-package development**: Shared types, utilities without publishing
- **Lower overhead**: npm workspaces are built into npm — no additional tools

### Negative
- **Larger repository**: Clone and CI are slower as the project grows
- **Coupled releases**: Harder to deploy client and server independently
- **Workspace quirks**: Some npm commands behave differently in workspaces

### Alternatives Considered
- **Polyrepo**: Separate repos for client and server. More isolation but higher coordination overhead. Rejected for early-stage project.
- **Turborepo/Nx**: More powerful monorepo tools. Premature for current project size — can migrate later if needed.
- **Yarn workspaces**: Similar to npm workspaces but adds a dependency. Rejected to minimize tooling.

## Status

Accepted

## Date

2026-04-10
