# MACO ERP Manual Database Migrations

These scripts are for manual local database migration. They are organized by the implementation phases in `docs/phase_implementation_tracker.md`.

Important:
- Back up your local database before running any script.
- These scripts describe the target roadmap schema. The current app schema is different in some places.
- Existing table conflicts are expected for `companies`, `orders`, `order_items`, `item_units`, `item_sizes`, and `supply_challans`.
- If your local database already has those old tables, decide manually whether to rename, export/import, or alter them before applying the target schema.
- The app code must be updated phase by phase before it can fully use the target schema.

Recommended manual order:
1. Run `01_phase_1_core_security_schema.sql`.
2. Run `02_phase_2_company_and_group_masters.sql`.
3. Run `03_phase_3_shipping_and_catalog_masters.sql`.
4. Run `04_phase_4_order_system.sql`.
5. Run `05_phase_5_documents_mail_excel.sql`.
6. Use `99_target_schema_indexes_and_checks.sql` after all tables exist.

For a fresh database, these scripts can be applied in sequence. For the current development database, inspect each table first with:

```sql
SHOW TABLES;
DESCRIBE companies;
DESCRIBE orders;
DESCRIBE products;
```

