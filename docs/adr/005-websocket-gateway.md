# ADR-005: WebSocket Gateway with API Key Authentication

## Context

Milestone 2 Part 1 established Redis Pub/Sub for broadcasting flag updates between server instances. Now we need to deliver those updates to connected clients (SDKs, dashboards) in real-time.

We need:
1. A WebSocket layer that clients connect to for live flag updates
2. Project-level isolation — clients should only receive updates for their project
3. Authentication — only authorized clients can subscribe
4. Integration with the existing Redis Pub/Sub channel

## Decision

### Transport: Socket.io
Use Socket.io over raw WebSockets for:
- Automatic reconnection with exponential backoff
- Room abstraction (project isolation)
- Fallback to HTTP long-polling
- Built-in namespace support
- TypeScript support

### Architecture: WebSocketGateway
- **Location**: `Server/src/gateways/websocket.gateway.ts` (new layer)
- **Responsibility**: Bridges Redis Pub/Sub ↔ Socket.io clients
- **Redis**: Uses a **separate** Redis subscriber client (ioredis requires dedicated connections for subscriptions)
- **Rooms**: Clients join `project:{projectId}` rooms

### Authentication: API Key Handshake
- Clients provide `x-aura-api-key` in the Socket.io `auth` object during handshake
- The gateway validates the API key against the database using `IFlagRepository.getProjectByApiKey()`
- If valid, the socket is assigned `socket.data.projectId` and auto-joined to the correct room
- If invalid, the connection is rejected with `next(new Error('Invalid API key'))`

### Message Flow
```
Redis PUBLISH → Gateway SUBSCRIBE → Parse FlagUpdateEvent
  → io.to(`project:${event.projectId}`).emit('flag_updated', event)
```

Only clients in the matching project room receive the update.

## Consequences

### Positive
- **Real-time**: Sub-second flag updates to all connected clients
- **Isolated**: Project rooms prevent cross-tenant data leakage
- **Authenticated**: API key validation prevents unauthorized subscriptions
- **Scalable**: Multiple gateway instances all subscribe to the same Redis channel

### Negative
- **Separate Redis client**: Subscriber mode requires a dedicated connection
- **Stateful**: WebSocket connections are stateful (unlike REST)
- **API key lookup per connection**: One DB query per handshake (cacheable in future)

### Alternatives Considered
- **Server-Sent Events (SSE)**: Simpler, but no Room abstraction, harder reconnection. Rejected.
- **Raw WebSockets (ws)**: Lighter, but no auto-reconnect, no rooms. Would need to build what Socket.io provides. Rejected.
- **GraphQL Subscriptions**: Overkill for this use case. Rejected.

## Status

Accepted

## Date

2026-04-11
