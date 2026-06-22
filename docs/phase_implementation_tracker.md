# MACO ERP Phase Implementation Tracker

This tracker converts the roadmap and flow diagrams into actionable implementation phases. It is intentionally separate from the architectural blueprint so the blueprint stays stable while implementation status changes.

## Current Baseline

The current project already has a React/Vite frontend, Express/MySQL backend, JWT login, admin/customer route guards, product catalog, cart checkout, order approval, challan upload, basic reports, and starter tests.

The current database and API do not fully match the roadmap schema yet. The existing app uses tables such as `users`, `products`, `product_categories`, and `primary_items`, while the roadmap expects `companies`, `items`, `primary_groups`, `sub_groups`, `shipping_carriers`, `orders`, `order_items`, and `supply_challans` with stricter relationships.

## Phase 1: Local DB & Security Shell

Status: Implemented with compatibility layer.

Scope:
- Align authentication with the roadmap `companies` account model.
- Keep bcrypt password hashing and JWT issuance.
- Keep Helmet, CORS, and rate limiting.
- Normalize role values to `ADMIN` and `CUSTOMER` or add a compatibility layer.
- Add route guards for admin-only endpoints and customer-owned data.
- Prepare target schema migration scripts.

Implementation notes:
- Backend login now reads from roadmap-style `companies` accounts first, then falls back to legacy `users` accounts during migration.
- JWT payloads include normalized `role_master` values (`ADMIN`, `CUSTOMER`) while still returning lowercase `role` values for existing React routes.
- The database bootstrap adds Phase 1 company account columns to existing local databases and seeds default company login accounts when missing.
- Manual migration `01_phase_1_core_security_schema.sql` prepares the target account columns without dropping legacy data.

Primary files likely affected:
- `backend/server.js`
- `backend/db/schema.sql`
- `backend/db/manual_migrations/01_phase_1_core_security_schema.sql`
- `src/context/AuthContext.jsx`
- `src/models/AuthModel.js`
- `src/views/components/ProtectedRoute.jsx`

Acceptance checks:
- Admin can log in and access admin workspace.
- Customer can log in and access customer portal only.
- Pending/rejected customers cannot log in unless this workflow is intentionally changed.
- Customer cannot access admin CRUD endpoints.

## Phase 2: Company & Group Masters

Status: Implemented with compatibility layer.

Scope:
- Replace or extend current company CRUD to support full company profile fields from the roadmap.
- Implement `primary_groups` master.
- Implement `sub_groups` master linked to `primary_groups`.
- Add chapter heading number support for sub-groups.
- Add live search/filtering for company and group tables.

Primary files likely affected:
- `src/views/pages/admin/ManageCompany.jsx`
- `src/views/pages/admin/ManagePrimaryItem.jsx`
- `src/views/pages/admin/ManageSubGroupItem.jsx`
- `src/models/CompanyModel.js`
- `src/models/MasterModel.js`
- `backend/server.js`
- `backend/db/manual_migrations/02_phase_2_company_and_group_masters.sql`

Implementation notes:
- Company admin now supports full roadmap profile fields, including contact names, credentials, addresses, tax identifiers, role, active state, live search, edit, and delete.
- Backend `/api/companies` supports searchable admin CRUD while returning legacy-compatible keys (`companyId`, `name`, `contact`) and roadmap keys (`company_id_code`, `company_name`, `contact_no`).
- Roadmap `/api/primary-groups` and `/api/sub-groups` endpoints are implemented with search, edit, delete, and admin-only mutations.
- Existing `/api/primary-items` remains as a compatibility alias backed by `primary_groups` during migration.
- Database bootstrap now creates `primary_groups` and `sub_groups`, and seeds them from legacy `primary_items` / `product_categories` when available.

Acceptance checks:
- Admin can create, view, update, delete, and search companies.
- Admin can create primary groups.
- Admin can create sub-groups under selected primary groups.
- Sub-group records preserve `chapter_heading_no`.

## Phase 3: Shipping & Catalog Master

Status: Implemented with compatibility layer.

Scope:
- Align current `products` implementation with roadmap `items`.
- Add item master fields: item code, item name, primary group, sub-group, size, unit, alternate unit, list price, and MRP.
- Keep or migrate current `item_units` and `item_sizes`.
- Implement `shipping_carriers` master.
- Add item search by code, name, primary group, and sub-group.

Primary files likely affected:
- `src/views/pages/admin/ManageItemMaster.jsx`
- `src/views/pages/admin/ManageItemUnit.jsx`
- `src/views/pages/admin/ManageItemSize.jsx`
- `src/views/pages/admin/ManageShippingType.jsx`
- `src/views/pages/customer/ProductCatalog.jsx`
- `src/controllers/ProductController.js`
- `src/models/MasterModel.js`
- `backend/server.js`
- `backend/db/manual_migrations/03_phase_3_shipping_and_catalog_masters.sql`

Acceptance checks:
- Admin can manage units, sizes, carriers, and items.
- Item records require valid group, sub-group, size, and unit references.
- Customer catalog loads only active/valid item records.

Implementation notes:
- Backend bootstrap now upgrades legacy `item_units` and `item_sizes` records into roadmap-style `unit_name` and `size_code` columns while preserving legacy `name` compatibility.
- `shipping_carriers` and roadmap `items` are created and seeded when absent.
- `/api/products` is now backed by roadmap `items` with joins to primary groups, sub-groups, sizes, and units, while still returning legacy-compatible keys used by existing catalog/cart components.
- Admin product mutations validate required group, sub-group, size, and unit references; customers only receive active catalog rows.
- Item unit, item size, shipping carrier, and item master admin screens now use live API CRUD instead of sample/static data.

## Phase 4: Order System & B2B Cart

Status: Implemented with compatibility layer.

Scope:
- Align checkout payload with roadmap order structure.
- Persist orders using `orders` and `order_items` with foreign keys to company, item, and size.
- Generate unique order numbers predictably.
- Restrict customer order history to the logged-in company.
- Implement admin dashboard status counts.
- Enforce allowed order states: `PENDING`, `ACCEPTED`, `REJECTED`, and `DISPATCHED`.

Primary files likely affected:
- `src/views/pages/customer/AddItemCart.jsx`
- `src/views/pages/customer/ManageOrder.jsx`
- `src/views/pages/admin/ManageOrder.jsx`
- `src/controllers/OrderController.js`
- `src/models/OrderModel.js`
- `backend/server.js`
- `backend/db/manual_migrations/04_phase_4_order_system.sql`

Acceptance checks:
- Customer can submit a cart as a pending order.
- Customer sees only their own orders.
- Admin can approve or reject pending orders.
- Rejected orders cannot be dispatched.
- Dashboard stats match database state.

Implementation notes:
- Checkout now writes roadmap-style order fields (`order_no`, `company_id`, `requisition_no`, `po_date`, `net_amount`, `order_status`) while keeping legacy response keys for existing screens.
- Order lines now persist relational item and size references (`order_id`, `item_id`, `size_id`, `unit_price`, `total_price`) alongside legacy display columns.
- Order numbers are generated predictably as yearly `MYYYY00001` sequences.
- Customer order listing is filtered to the logged-in company; admins continue to see the full order queue.
- Admin review enforces the allowed lifecycle states and prevents non-pending orders from being approved/rejected again.
- `/api/dashboard/stats` provides status counts and accepted/dispatched revenue directly from the database.
- The customer catalog now includes API-backed item master records first so cart checkout can submit valid item references.

## Phase 5: Documents, Mail & Excel

Status: Implemented with compatibility layer.

Scope:
- Upgrade current purchase-order PDF into proper invoice/challan document generation.
- Add Excel export for catalog, orders, and supply tracking.
- Add order placed email notifications.
- Add dispatch/challan created email notifications.
- Link challan creation to accepted orders and shipping carriers.

Primary files likely affected:
- `src/services/PDFService.js`
- `src/views/pages/admin/Reporting.jsx`
- `src/views/pages/admin/UploadChallanDetails.jsx`
- `src/views/pages/admin/TrackSupplyDetails.jsx`
- `src/views/pages/customer/TrackSupplyDetails.jsx`
- `backend/server.js`
- `backend/db/manual_migrations/05_phase_5_documents_mail_excel.sql`

Acceptance checks:
- Admin can generate/download invoice or challan PDF.
- Admin can export orders/supplies/catalog to `.xlsx`.
- Customer can track dispatch details.
- Email sending is skipped safely when SMTP is not configured.

Implementation notes:
- PDF service now generates structured invoice and supply challan documents from live order/challan data.
- Backend challan creation requires an accepted order and valid shipping carrier, links the challan to `orders`, `companies`, and `shipping_carriers`, then moves the order to `DISPATCHED`.
- Admin and customer supply tracking now read roadmap-style challan fields, support date filtering, and expose `.xlsx` supply exports.
- Reporting exports are available for catalog, orders, and supplies through server-generated SheetJS workbooks.
- Order placed and challan created notifications use Nodemailer when SMTP settings are present and skip safely for local installs.

## Phase 6: Audits, QA & Local Ready

Status: Implemented with local readiness checks.

Scope:
- Update tests to match final auth, order, and challan workflows.
- Add endpoint tests for admin-only and customer-owned data restrictions.
- Add DB integrity checks for foreign keys and order state transitions.
- Add local launch checklist.
- Clean up obsolete schema/code paths after migration.

Primary files likely affected:
- `backend/test/api.test.js`
- `backend/test/api.extended.test.js`
- `backend/db/schema.sql`
- `README.md`
- `docs/phase_implementation_tracker.md`

Acceptance checks:
- Backend tests pass.
- Frontend build passes.
- Manual smoke test covers login, catalog, checkout, approval, challan, tracking, PDF, and export.

Implementation notes:
- Added Phase 6 QA coverage for normalized auth, admin-only mutation boundaries, customer checkout ownership, pending-only order review, challan dispatch state changes, tracking visibility, dashboard/export permissions, and roadmap relation integrity.
- Added `backend/scripts/audit-phase-6.js` to verify required roadmap tables, performance indexes, orphaned relations, invalid order statuses, and dispatch consistency against the local MySQL database.
- Backend scripts now expose `npm test`, `npm run test:phase6`, and `npm run audit:phase6`.
- README now includes the local launch checklist and manual smoke-test route.

## Suggested Implementation Order

1. Phase 1: stabilize schema/auth foundation.
2. Phase 2: implement company and group masters.
3. Phase 3: implement item and shipping masters.
4. Phase 4: implement strict order lifecycle.
5. Phase 5: implement document/export/email workflows.
6. Phase 6: harden tests and local readiness.
