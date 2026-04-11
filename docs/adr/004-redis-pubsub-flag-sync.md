# ADR-004: Redis Pub/Sub for Real-Time Flag Sync

## Context

Aura's Flag Engine (Milestone 1) supports flag evaluation, but flag state changes are invisible to connected clients until they re-poll the API. For a feature flag system to be useful at scale, SDKs and dashboards need to receive flag updates **in real-time** — ideally within milliseconds of a toggle.

We need a mechanism for:
1. Broadcasting flag state changes to all interested consumers
2. Supporting multiple server instances (horizontal scaling)
3. Decoupling the write path (flag toggle) from the notification path
4. Enabling future WebSocket integration for client push

## Decision

Use **Redis Pub/Sub** via `ioredis` for real-time flag update broadcasting.

### Channel Design
- Single channel: `aura:flags:updates`
- Each message is a `FlagUpdateEvent` JSON payload containing:
  - `projectId`, `environmentId`, `featureKey`, `enabled`
  - `source` (who triggered: API, dashboard, CI/CD)
  - `timestamp` (ISO 8601)

### Service Design
- `IPubSubService` interface defined in models (dependency inversion)
- `PubSubService` concrete class uses ioredis `publish()`
- `FlagService.updateFlagState()` calls `pubsub.publishFlagUpdate()` after persisting the change
- Future WebSocket gateway will `subscribe()` to the same channel

### Why Redis Pub/Sub (not alternatives)?
- We'll likely already need Redis for caching flag evaluations
- Pub/Sub is fire-and-forget — minimal overhead
- No message persistence needed (flags are always re-evaluable from DB)
- ioredis is a mature, well-typed Node.js client

## Consequences

### Positive
- **Real-time delivery**: Sub-millisecond latency from toggle to notification
- **Horizontal scaling**: All server instances receive updates via Redis
- **Decoupled**: Publishers don't know about subscribers
- **Simple**: Built-in Redis feature, no additional infrastructure

### Negative
- **No persistence**: If a subscriber is disconnected, they miss messages (acceptable — they re-evaluate from DB)
- **No delivery guarantees**: Fire-and-forget semantics (acceptable for flag updates)
- **Redis dependency**: Adds Redis as infrastructure requirement

### Alternatives Considered
- **PostgreSQL LISTEN/NOTIFY**: No additional dependency, but doesn't scale across multiple databases and has payload size limits (8KB). Rejected.
- **Server-Sent Events (SSE) directly**: Doesn't help with multi-instance sync. Could augment but not replace Pub/Sub. Rejected as primary mechanism.
- **Message queue (RabbitMQ/NATS)**: Overkill for fire-and-forget flag notifications. Better suited for ordered/guaranteed delivery. Rejected.

## Status

Accepted

## Date

2026-04-11
