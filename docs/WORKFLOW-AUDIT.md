# Workflow audit — 3 October 2026

## Findings and changes

The navigation advertised working modules, but most populated pages were read-only. A delivery required opening its details just to inspect information, and neither view allowed changes. Tasks could only be completed from the dashboard. Product, contact, payment and note records had no editing workflow. There were no page-level search or status filters.

Populated pages now provide a visible Edit action beside the record identifier. Editing opens a prefilled dialog on the current page; Save updates the list, Cancel discards the draft, and Escape closes the editor. Required fields, nonnegative numbers, enumerated statuses, record references and event time ordering are validated. Invalid writes leave records and audit history unchanged. Save has a pending state and errors preserve the draft. Keyboard focus is contained in the dialog and returns to the initiating action after it closes. Long editors have sticky Save/Cancel controls. Search ignores Greek accents and can match related customer/employee names; status filters, counts, reset and empty-result feedback support finding records.

## Page responsibilities

| Page | Responsibility | Available actions / limits |
| --- | --- | --- |
| Dashboard | Operational overview and exceptions | Existing quick task/note creation, task completion and links to working pages |
| Tasks | Manage work, ownership, priority and deadlines | Create, edit, complete/reopen through status, search/filter |
| Deliveries | Manage current delivery records | Edit customer/address/time/vehicle/driver/status/payment/fee/notes directly from list or details; search/filter |
| Calendar | Coordinate the demo day's appointments | Edit independent events; open linked delivery to reschedule it consistently |
| Inventory | Monitor products and stock levels | Edit name, quantity, threshold, selling price and location; search |
| Customers | Maintain customer contact information | Edit name, phone, email, address, VAT number and notes; search |
| Finance | Track internal payment records | Edit description, payment method and payment status; search/filter; linked payment cancellation unavailable |
| Notes | Capture and maintain operational information | Create, edit content/category and pin/unpin; search |
| Activity | Review mutation history | Read-only audit trail |
| Stock movements | Record receipts, issues and transfers | Placeholder; no movement ledger implemented |
| Suppliers | Maintain supplier contacts | Placeholder; no supplier repository implemented |
| Documents | Store and link documents | Placeholder; no storage/upload implemented |
| Settings | Explain the current environment | Read-only prototype information; no configurable preferences or authorization |

## Cross-page consistency

- Delivery financial changes update the matching payment record. If the seed delivery has no payment record, changing its financial fields creates one so pending totals remain accurate.
- Payment status updates flow back to the linked delivery. A linked payment cannot be cancelled independently because deliveries have no corresponding cancelled-payment state.
- Delivery rescheduling shifts linked calendar events while preserving duration and updating location.
- Signals refresh dashboard counts, low-stock warnings, names and pinned notes after edits.
- Every successful edit records an activity. Missing records and invalid input produce no write or activity.

## Verification

Automated coverage renders all 13 navigation/settings destinations plus a missing delivery, exercises list-to-editor save and cancellation, checks editor configuration for each editable page, tests local search/filter behavior, and verifies repository validation and cross-page relationships. Run `npm test -- --watch=false` and `npm run build`.

Chrome desktop inspection confirmed the delivery list opens a populated editor on the same URL and saving closes it, displays success feedback and updates the row. This is a functional smoke check, not a measured frame-rate/performance benchmark. Mobile CSS includes full-width controls, 44px targets and a bottom-sheet editor; mobile visual verification was not completed.

## Remaining product gaps

1. Data is still session-only. Refresh restores the seed records; authentication and real user permissions are absent.
2. There is no separate Orders entity. Deliveries are the closest current workflow; order creation and editable line items need a distinct product decision and data model.
3. Stock movements, suppliers and documents remain unfinished modules. Their descriptions now state their intended purpose and preparation state.
4. New deliveries/products/customers/payments/events cannot yet be created. Creation currently covers tasks and notes.
5. The calendar remains limited to the seed day. Date navigation and full scheduling views are still needed.
6. Date editors and existing displays use the demo's UTC+03 offset. Full Europe/Athens daylight-saving handling is needed before scheduling winter dates in production.
7. Partial payment status does not track paid-versus-outstanding amounts; finance totals count the full partial record amount. Payment instalments, cancellation/refunds and multi-transaction delivery accounting need a richer model.
8. Editing stock quantity is a prototype correction, not an audited stock movement. Production stock changes should create ledger entries and enforce allocation rules.
9. Global search navigates to entity lists for most results rather than locating a specific record. Page search reduces this friction, but record-specific deep links remain useful.
