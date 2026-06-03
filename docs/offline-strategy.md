# Offline Strategy

## Connectivity awareness

`components/connectivity-monitor.tsx` listens for browser `online` and `offline` events, updates `stores/connectivity-store.ts`, refreshes queue counts, and drains the queue when the connection returns.

## Operator feedback

`components/offline-banner.tsx` stays visible when the app is offline, retrying, or has pending queued mutations. Existing toast infrastructure is used for reconnect notifications.

## IndexedDB queue

`services/offline-queue.ts` stores transiently failed `POST`, `PUT`, and `PATCH` requests in IndexedDB using `idb`.

Safeguards:

- auth endpoints are not queued
- `FormData` payloads are skipped
- deterministic request IDs avoid duplicate queued submissions
- queued retries bypass re-queueing
- current auth is reapplied by Axios during retry

Operators should still verify critical production actions after a long outage, especially where the backend does not provide idempotent mutation semantics.
