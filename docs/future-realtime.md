# Future Realtime Recommendations

## Recommended direction

Use a server-owned event stream for kitchen production state:

- WebSocket or Server-Sent Events for live conveyor, expired item, and production dashboard updates.
- SWR cache mutation as the frontend integration point.
- The existing offline queue remains responsible for client-originated mutations.

## Reliability requirements

- Include server sequence numbers or updated timestamps in realtime payloads.
- Revalidate from REST after reconnect before applying live deltas.
- Keep mutation endpoints idempotent with `X-Client-Request-Id`.
- Track outlet scope explicitly in realtime subscriptions.

## Backend preparation

The Laravel backend should accept and persist client request IDs for write endpoints that can be retried, especially production plan saves, produce actions, sold/waste marking, and closing report submissions.
