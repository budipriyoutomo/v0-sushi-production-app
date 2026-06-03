# Architecture Decisions

## Incremental PWA hardening

The application keeps the existing Next.js App Router layout and component structure. New operational infrastructure is added in focused top-level folders:

- `stores/` for persisted auth, connectivity, active outlet, and operational UI state.
- `services/` for cross-cutting browser services such as offline queueing and logging.
- `hooks/` remains the compatibility layer used by existing components.
- `lib/api/` remains the API boundary.

This avoids a high-risk rewrite while creating clear homes for future modules.

## Reliability over visual change

No UI redesign was introduced. The only visible addition is a small offline/sync banner and existing toast usage for operator feedback.

## Auth stability

Auth still uses the existing token flow, but session state is now persisted with Zustand. Temporary API outages do not clear the local user or token. Invalid auth responses from the auth restoration endpoint still clear the session.

## Error monitoring preparation

`services/error-logger.ts` centralizes operational logging. Sentry can be initialized there later and callers will not need to change.
