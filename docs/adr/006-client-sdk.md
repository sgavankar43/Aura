# ADR-006: Client SDK Architecture

## Context

Aura's Server delivers feature flags via REST API and real-time WebSocket updates. Client applications need a library to:

1. Fetch the initial flag state for their project + environment
2. Receive real-time updates via WebSocket
3. Evaluate flags with zero-latency (no network call per evaluation)
4. Continue working when offline (graceful degradation)

## Decision

### Package: `@aura/sdk` (monorepo workspace)

A new `SDK/` workspace in the monorepo. Publishes as `@aura/sdk` on npm.

### Architecture: Local Cache + WebSocket Sync

```
┌─────────────────────────────────┐
│          AuraClient             │
│                                 │
│  ┌───────────┐  ┌────────────┐  │
│  │ FlagCache │  │ Transport  │  │
│  │ (Map)     │◄─│ (Socket.io)│  │
│  └─────┬─────┘  └────────────┘  │
│        │                        │
│  isEnabled()  ◄── sync from ws  │
│  onUpdate()   ◄── event bus     │
└─────────────────────────────────┘
```

**Initialization flow:**

1. `AuraClient.init({ apiKey, serverUrl, environment })` → connects to server
2. Fetches initial flags via REST: `GET /api/flags/{envSlug}` (authenticated by API key)
3. Populates the in-memory `FlagCache`
4. Establishes a Socket.io connection (authenticated via `x-aura-api-key`)
5. Listens for `flag_updated` events → updates cache + fires `onUpdate` callbacks

**Evaluation:**

- `isEnabled('feature-key')` reads from the `FlagCache` — zero network latency
- Returns `false` for unknown keys (safe default)

**Offline mode:**

- On successful fetch, flags are persisted to `localStorage` (browser) or in-memory (Node.js)
- If the initial fetch fails, the SDK loads from localStorage as a fallback
- If localStorage is also empty, all flags default to `false`
- Strategy is configurable: `'memory' | 'localStorage'`

### Type Safety: Generic Flag Keys

```typescript
// Developer defines their flag keys
type MyFlags = 'dark-mode' | 'new-dashboard' | 'beta-feature';

// SDK provides autocomplete
const client = new AuraClient<MyFlags>({ ... });
client.isEnabled('dark-mode'); // ✅ autocomplete
client.isEnabled('typo');       // ❌ TypeScript error
```

### Public API

```typescript
class AuraClient<TFlags extends string = string> {
  static async init<T extends string>(config: AuraClientConfig): Promise<AuraClient<T>>;
  isEnabled(key: TFlags): boolean;
  getAllFlags(): Record<TFlags, boolean>;
  onUpdate(callback: FlagUpdateCallback<TFlags>): () => void;
  destroy(): void;
}
```

## Consequences

### Positive

- **Zero-latency evaluation**: In-memory lookup, no network per call
- **Real-time**: WebSocket sync keeps cache fresh
- **Offline-resilient**: localStorage fallback for browser environments
- **Type-safe**: Generic flag keys with autocomplete
- **Minimal bundle**: No heavy dependencies (socket.io-client is the only dep)

### Negative

- **Eventual consistency**: Brief window between server update and client cache
- **localStorage limits**: ~5MB per domain (sufficient for flags)
- **Socket.io dependency**: Adds ~40KB gzipped to client bundle

## Status

Accepted

## Date

2026-04-11
