# Katis Operations — frontend foundation

Installed Angular/CLI: 22.2.1. Standalone components, strict TypeScript, Angular signals and Reactive Forms. No additional runtime dependencies were introduced.

## Boundaries

- `core/models/entities.ts`: normalized domain records, UUID identifiers, timestamps and creator relationships.
- `core/services/operations.repository.ts`: injectable data-access contract. The mock implementation owns session data; components do not own records.
- `core/services/mock-operations.repository.ts`: fictional Greek seed data and asynchronous task/note mutations with activity records.
- `core/services/operations.service.ts`: derived dashboard state, relation resolution and cross-entity search.
- `layout/`: app shell, grouped sidebar, topbar, global search, notifications, responsive drawer and quick-create dialog host.
- `shared/components/`: icons, page header, summary cards, status/priority badges and accessible validated quick-create form.
- `features/dashboard/`: dashboard presentation and task completion.
- `features/feature-preview.*`: explicitly labeled, read-only previews and preparation pages. Replace these routes with independent feature components as each module is implemented. Feature directories are scaffolded; empty directories are not tracked by Git.
- `app.routes.ts`: lazy shell, dashboard and preview boundaries; delivery detail precedes list routes; unknown paths return to the dashboard.

Name and business details live in `APP_SETTINGS`. Greek is registered as the Angular locale. The prototype deliberately uses 3 October 2026 for its seed date, so historical mock activity stays coherent. Production should obtain the business date in Europe/Athens.

## Current behavior

The desktop sidebar starts collapsed, expands while hovered or containing keyboard focus, and collapses after both leave. Mobile navigation remains a menu-controlled drawer.

Dashboard statistics derive from repository records. Completing a task changes the count and audit feed. Task and pinned-note forms validate required fields and store new records in memory. Search resolves related customer names for deliveries, tasks and payments. Delivery details resolve UUID relationships. All changes are lost on refresh. No localStorage database, external writes, Supabase SDK, authentication, realtime or browser push notifications are present.

The user profile and alerts are demonstrations, not authenticated identity or live scheduling. New delivery, movement, payment and customer actions currently open their preparation/preview routes. Dashboard event links without a related delivery open the calendar preview. Full filters, editing, Kanban and day/week/month calendar interactions belong to the next phase.

## Supabase transition

Implement `SupabaseOperationsRepository` against the existing injection token. Keep SDK calls in the data layer. Load records into readonly signal stores and expose explicit loading/error state. Query only the user's authorized records, reconcile successful writes from server responses, and subscribe to table changes with teardown. Refresh or reconcile records after reconnect. Avoid client-side role checks as the sole security control.

Add Auth-backed profiles and route guards once a real session exists. Enforce access through RLS and validated SQL functions. Inventory posting must be an atomic server operation; never allow independent browser updates of movement and stock. Server timestamps, transactionally written audit logs and conflict handling are necessary for the 3–4 simultaneous users. Use an `updated_at` or version condition for concurrent edits and surface conflicts to the employee.

Environment configuration should contain only the Supabase URL and publishable key. Service-role keys stay server-side. Storage should use private buckets and signed, authorized downloads. An HTTP repository adapter can delegate privileged operations to Cloudflare Workers later without changing presentation components.

## Next increments

1. Split tasks and deliveries out of previews; add full reactive forms, filters, list/detail screens and status transitions.
2. Implement inventory movement rules and day/week/month scheduling.
3. Add session-backed authentication, database migrations, RLS policies and repository integration tests.
4. Add realtime reconciliation, private document storage and role-specific flows.

## Mobile interaction

At widths up to 760px, search occupies a dedicated row below the sticky topbar. Dashboard deliveries become tappable cards; other preview tables remain horizontally scrollable and keyboard-focusable. Touch controls have larger targets. The drawer has a close button, Escape support, focus containment, and makes the background inert while open. Closed mobile navigation is inert. Drawer and modal overlays lock background scrolling; forms become bottom sheets with 16px inputs and safe-area padding. Desktop hover behavior remains unchanged.
