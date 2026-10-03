# Proposed PostgreSQL model

This is a design plan, not a deployed database or migration. TypeScript models are the initial frontend contracts and will expand with each feature.

| Table           | Relationships / purpose                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| profiles        | `id` references `auth.users`; display name, constrained admin/employee role                                                   |
| customers       | Contact details, address, VAT number, profession, notes                                                                       |
| suppliers       | Company contact details, representative, VAT number, notes                                                                    |
| vehicles        | Internal vehicle name and registration                                                                                        |
| products        | Supplier FK, unique SKU, category, unit, prices, minimum stock, location, active flag                                         |
| tasks           | Assigned profile, optional customer/delivery/product FKs, status, priority, due date                                          |
| deliveries      | Customer, vehicle and driver FKs; business delivery number, scheduled timestamp, address, fee, payment and delivery status    |
| delivery_items  | Delivery and product FKs; quantity and eventually agreed price snapshot                                                       |
| stock_movements | Product, employee, supplier/customer and optional delivery FKs; movement number, signed quantity/type, source and destination |
| transactions    | Optional customer/supplier/delivery FKs; amount, payment method, type, category, status, recorded date                        |
| notes           | Author; optional customer/supplier/delivery/task FKs, category, reminder and pinned flag                                      |
| documents       | Private storage path, MIME type, optional customer/supplier/delivery/transaction/product/task FKs                             |
| calendar_events | Start/end timestamptz, type, location, optional delivery/task FKs                                                             |
| activity_logs   | Actor FK, entity type/UUID, action, timestamp; immutable server-generated audit                                               |

## Common columns and constraints

Use `uuid primary key default gen_random_uuid()`, `created_at timestamptz`, `updated_at timestamptz`, and `created_by uuid references profiles(id)` on business records. Profiles bootstrap from Auth; system actions may require a nullable actor. Create/update timestamps must be server-owned. Use numeric decimal types for money and quantities, not floating point. Separate display numbers from UUID primary keys.

Constrain statuses, movement types, units and roles. Positive delivery-item quantities, nonnegative fees/prices, valid event intervals and nonblank names should be enforced by SQL. Index foreign keys, scheduled times, task due dates and activity timestamps. Add tenant/company ownership if the application expands beyond this single company.

Customer outstanding balance and supplier balance should derive from orders, obligations and recorded settlements; they should not be arbitrarily edited contact fields. Partial payments need individual settlement records or explicit paid/remaining amounts before finance becomes operational. The current prototype only seeds pending transactions.

For the initial single warehouse, inventory quantity can be a maintained snapshot updated by a single transactional posting function. With multiple locations, introduce `locations` and `stock_balances(product_id, location_id)` with a unique composite key. Transfers affect two balances atomically. Preserve a full movement ledger; adjustments require a reason and permissions. Decide whether negative stock is allowed before backend implementation.

Avoid cascading deletion of posted finance, inventory and audit records. Prefer cancellation/archival and preserve references. Store attachment metadata in documents and use separate linking tables if one document must belong to multiple entities. Add task comments/attachments and supplier-product associations as independent child tables when those features are built.

## Security and multi-user operation

All exposed tables need RLS. Admin/employee privileges must be enforced by policies and protected server functions. Users must not be able to promote their own profile role. Audit records should be appended by database triggers/functions, not trusted from the browser. Sensitive finance access is admin-only under the proposed roles.

Use private Supabase Storage policies. Subscribe only to authorized data. Realtime informs clients of changes; SQL transactions and optimistic concurrency checks enforce integrity. Reconcile after dropped connections and do not assume receiving every event is guaranteed.
