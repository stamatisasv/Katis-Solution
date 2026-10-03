# Katis Operations

Greek internal business operations prototype for Κατής Δημήτριος & Σία Ο.Ε., Lemnos. Built with Angular 22.2.1, standalone components, signals and Reactive Forms.

## Run

```sh
npm install
npm start
```

Open http://localhost:4200 on this computer. The dev server listens on `0.0.0.0`; other devices on the same network can open `http://<your-computer-LAN-IP>:4200`. Verify with `npm run build` and `npm test -- --watch=false`.

## First phase

Complete responsive dashboard and application shell, all 13 navigation destinations, cross-entity search, notification panel, expandable desktop sidebar, mobile drawer, session-only task/note creation and task completion. Same-page editors cover tasks, deliveries and UUID delivery details, inventory, customers, payments, notes and standalone daily appointments. Populated lists include local search and status filters where applicable. Activity remains read-only. Remaining destinations clearly show their preparation state.

The seed day is **3 October 2026**. All contacts and operational records are fictional. Mock mutations live only in memory and reset on refresh. Supabase, authentication and realtime are intentionally not connected. This is a frontend prototype, not a secured production ERP.

See [frontend architecture](docs/ARCHITECTURE.md) and [database planning](docs/DATABASE-PLAN.md) for boundaries, limitations and the next implementation phases.

See [workflow audit](docs/WORKFLOW-AUDIT.md) for page responsibilities, tested improvements and remaining gaps.
