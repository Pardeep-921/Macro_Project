# MACO ERP System - Client Understanding Document

## 1. Project Overview

The MACO ERP System is a web-based business portal developed to manage company customers, product/item masters, customer orders, order approval, dispatch challans, supply tracking, reports, and documents from one centralized system.

Earlier business data was handled in separate areas such as customer details, item records, order records, and supply details. This project brings those activities into one connected ERP portal so MACO staff and customers can work with the same updated information.

The system has two main user areas:

- Admin Portal: Used by MACO staff to manage companies, products, orders, challans, dispatch details, reports, and system master data.
- Customer Portal: Used by customers to view items, add products to cart, submit orders, check order status, and track supply/challan information.

## 2. Main Purpose Of The System

The purpose of this ERP portal is to reduce manual work and make daily operations faster, clearer, and more reliable.

The system helps MACO to:

- Maintain customer/company records in one place.
- Maintain product/item catalog data with size, unit, group, sub-group, price, and MRP details.
- Allow customers to place orders online.
- Allow admin users to approve or reject orders.
- Generate and manage supply challan/dispatch records.
- Track order status from pending to accepted, rejected, or dispatched.
- Export reports in Excel format.
- Generate PDF documents such as invoices and challans.
- Protect admin and customer data using login-based access control.

## 3. User Roles Implemented

### 3.1 Admin User

The admin user is the MACO internal user. Admin users have permission to manage master data and business operations.

Admin can:

- Log in to the admin dashboard.
- Manage company/customer accounts.
- Manage primary groups and sub-groups.
- Manage item units, item sizes, shipping carriers, and item master records.
- View customer orders.
- Approve or reject pending orders.
- Upload challan and dispatch details for accepted orders.
- Track supply details.
- Generate/download PDF documents.
- Export catalog, order, and supply data in Excel format.
- View dashboard counts and business summaries.

### 3.2 Customer User

The customer user is a company/customer account that can place and track orders.

Customer can:

- Log in to the customer portal.
- View the product/item catalog.
- Search and filter items.
- Add required items to cart.
- Submit an order with quantity, size, destination, PO date, and requisition details.
- View only their own order history.
- Check whether an order is pending, accepted, rejected, or dispatched.
- Track supply/challan details after dispatch.

## 4. Modules Implemented

### 4.1 Login And Security Module

The login system has been implemented for both admin and customer users.

Key functionality:

- Secure username and password login.
- Passwords are stored using encrypted hashing.
- Login returns a secure token for accessing protected pages.
- Admin and customer users are separated by role.
- Admin pages are protected from customer access.
- Customer data is restricted so one customer cannot view another customer's order data.
- Inactive or unauthorized users cannot access the portal.
- API security includes request protection, CORS control, security headers, and rate limiting.

Client benefit:

This ensures that business data is protected and only authorized users can access the correct part of the system.

### 4.2 Admin Dashboard

The admin dashboard gives MACO staff a quick overview of the system.

Implemented functionality:

- Shows order status counts.
- Shows pending, accepted, rejected, and dispatched order data.
- Provides quick navigation to important admin sections.
- Helps admin users monitor current order activity.

Client benefit:

Admin users can understand business activity quickly without manually checking multiple records.

### 4.3 Company Management Module

This module allows admin users to maintain customer/company account records.

Implemented functionality:

- Add new company/customer records.
- Edit existing company details.
- Delete company records when required.
- Search company records.
- Store company code, company name, username, contact person, email, mobile number, address, city, state, pincode, and tax-related fields.
- Maintain customer login role and active status.

Client benefit:

MACO can maintain complete customer records in one organized place, including business, contact, and tax information.

### 4.4 Primary Group Management

This module is used to create the main product categories.

Implemented functionality:

- Add primary groups.
- Edit primary group details.
- Delete primary groups.
- Search primary groups.
- Store group name and description.

Example:

- Connecting Rod Kits
- Piston Pins
- Engine Parts

Client benefit:

Products can be organized under clear main categories, making item management and customer searching easier.

### 4.5 Sub-Group Management

This module is used to create sub-categories under primary groups.

Implemented functionality:

- Add sub-groups.
- Link each sub-group with a primary group.
- Store chapter heading number where required.
- Edit and delete sub-groups.
- Search sub-group records.

Client benefit:

MACO can organize items in a more detailed structure, which improves catalog management and reporting.

### 4.6 Item Unit Management

This module manages measurement units used for items.

Implemented functionality:

- Add item units.
- Edit item units.
- Delete item units.
- Search item units.

Examples:

- PCS
- SET
- BOX

Client benefit:

Item quantity and billing can be handled consistently using standard unit names.

### 4.7 Item Size Management

This module manages item sizes used in the product catalog and order process.

Implemented functionality:

- Add item sizes.
- Edit item sizes.
- Delete item sizes.
- Search item sizes.

Examples:

- STD
- 001
- 010

Client benefit:

Customers can choose the correct item size while placing orders, and admin users can maintain standard size values.

### 4.8 Shipping Carrier / Shipping Type Management

This module manages transport and shipping carrier details.

Implemented functionality:

- Add shipping carrier records.
- Edit shipping carrier records.
- Delete shipping carrier records.
- Search shipping carriers.

Client benefit:

MACO can maintain transport partner names and use them while creating dispatch/challan records.

### 4.9 Item Master / Product Catalog Module

This is one of the core modules of the ERP system. It maintains all product/item details.

Implemented functionality:

- Add new item master records.
- Edit item details.
- Delete item records.
- Search items by code, name, group, and sub-group.
- Store item code, item name, primary group, sub-group, size, unit, alternate unit, list price, and MRP.
- Customer product catalog reads item master data from the system.
- Product records are linked with valid group, sub-group, size, and unit records.

Client benefit:

MACO can maintain one accurate product catalog, and customers can place orders using live item data.

### 4.10 Customer Product Catalog

This is the customer-facing item browsing screen.

Implemented functionality:

- Customers can view available item/product records.
- Customers can search and filter products.
- Product details are loaded from the item master.
- Customers can choose item size and quantity before adding products to cart.

Client benefit:

Customers can place orders online without needing manual item lists or phone/email confirmation for every product selection.

### 4.11 Customer Cart And Checkout

This module allows customers to prepare and submit orders.

Implemented functionality:

- Add multiple items to cart.
- Select item size and quantity.
- Calculate item price and total order amount.
- Submit order with destination, PO date, requisition number, and item list.
- After checkout, the order is saved with pending status.
- Cart is cleared after successful order submission.

Client benefit:

Customers can create structured purchase orders online, and MACO receives order data in a clear and trackable format.

### 4.12 Order Management Module

This module manages the complete order lifecycle.

Implemented functionality:

- Orders are created by customers.
- Each order receives a unique order number.
- Order lines are stored with item, size, quantity, unit price, and total amount.
- Customer users can see only their own orders.
- Admin users can see all customer orders.
- Admin can approve or reject pending orders.
- Accepted orders can be moved to dispatch/challan process.
- Rejected orders cannot be dispatched.

Order statuses implemented:

- PENDING: Order submitted by customer and waiting for admin review.
- ACCEPTED: Order approved by admin.
- REJECTED: Order rejected by admin.
- DISPATCHED: Challan/dispatch details uploaded and order sent for supply.

Client benefit:

Every order has a clear status, reducing confusion between customer and admin teams.

### 4.13 Challan And Dispatch Management

This module is used after an order is accepted.

Implemented functionality:

- Admin can create/upload challan details only for accepted orders.
- Challan record is linked with order, company, and shipping carrier.
- Challan number, challan date, carrier, and supply details are stored.
- After challan creation, order status changes to dispatched.
- Dispatch notification can be sent through email when mail configuration is available.

Client benefit:

MACO can track dispatch details properly, and customers can see supply information after the order is dispatched.

### 4.14 Supply Tracking Module

This module helps admin and customer users track dispatch/supply records.

Implemented functionality:

- Admin can view supply records for orders.
- Customer can view supply/challan records related only to their company.
- Date filters are available for tracking records.
- Supply data can be exported to Excel.

Client benefit:

Customers get better visibility of dispatched orders, and MACO can quickly check supply history.

### 4.15 PDF Document Generation

PDF generation has been implemented for business documents.

Implemented functionality:

- Generate structured invoice documents.
- Generate supply challan documents.
- PDF documents include order/challan data in tabular format.
- Documents are generated using live system data.

Client benefit:

MACO can prepare professional documents directly from the ERP data without manually creating separate files.

### 4.16 Excel Reporting Module

Reporting and export functionality has been implemented.

Implemented functionality:

- Export product/catalog data to Excel.
- Export order data to Excel.
- Export supply/challan data to Excel.
- Reports are generated in `.xlsx` format.

Client benefit:

MACO can use exported reports for accounting, review, reconciliation, and offline sharing.

### 4.17 Email Notification Support

Email notification support has been added in the backend.

Implemented functionality:

- Order placed email notification support.
- Challan/dispatch created email notification support.
- Email sending works when SMTP settings are configured.
- If SMTP is not configured, the system skips email safely without breaking order or challan workflow.

Client benefit:

The system is ready for automated communication once live email settings are provided.

## 5. Complete Business Flow Implemented

The current implemented flow is:

1. Admin creates company/customer account.
2. Admin creates primary groups and sub-groups.
3. Admin creates item sizes, item units, and shipping carriers.
4. Admin creates item master/product catalog records.
5. Customer logs in to the customer portal.
6. Customer searches items and adds required items to cart.
7. Customer submits order.
8. Order is saved as pending.
9. Admin reviews the pending order.
10. Admin approves or rejects the order.
11. If approved, admin uploads challan and dispatch details.
12. Order moves to dispatched status.
13. Customer checks order and supply tracking details.
14. Admin exports reports or generates PDF documents when required.

## 6. Database And Data Management

The project uses a MySQL database to store all business records.

Main data areas implemented:

- Company/customer accounts.
- Product primary groups.
- Product sub-groups.
- Item units.
- Item sizes.
- Shipping carriers.
- Item master/product catalog.
- Orders.
- Order item lines.
- Supply challans.

The current implementation also includes compatibility support for existing old table structures. This means the system can work with current data while gradually aligning to the improved ERP database structure.

Client benefit:

This reduces migration risk because existing data can be supported while new ERP-style records are added.

## 7. Security And Access Control

Security features implemented:

- Encrypted password storage.
- JWT token-based login sessions.
- Admin/customer role separation.
- Protected admin routes.
- Customer-owned data restriction.
- API request rate limiting.
- Secure HTTP headers.
- CORS origin control.

Client benefit:

The ERP portal protects business data and prevents users from accessing information or actions outside their permission level.

## 8. Testing And Quality Checks

Quality and readiness work has been added for the project.

Implemented checks:

- Backend API tests.
- Auth workflow checks.
- Admin permission checks.
- Customer order ownership checks.
- Order status transition checks.
- Challan dispatch consistency checks.
- Dashboard and export permission checks.
- Database audit script for required tables, indexes, relationships, invalid statuses, and dispatch consistency.

Client benefit:

The system has validation support to confirm important workflows are working correctly before local/demo use.

## 9. Current Project Status

Current implementation status:

- Phase 1: Login, security, and database foundation - Implemented.
- Phase 2: Company and group masters - Implemented.
- Phase 3: Shipping and item catalog masters - Implemented.
- Phase 4: Customer cart and order system - Implemented.
- Phase 5: PDF, Excel, email, and challan workflow - Implemented.
- Phase 6: QA, audit scripts, and local readiness - Implemented.

Overall status:

The core MACO ERP workflow is implemented with admin and customer portals, master data management, online order placement, approval workflow, challan/dispatch tracking, reporting, and security controls.

## 10. What The Client Can Understand As Delivered

The project currently delivers a working ERP foundation where:

- MACO can manage customers and product master data.
- Customers can log in and place orders online.
- Admin can approve, reject, and dispatch orders.
- Dispatch records are linked with challan and carrier details.
- Customers can track order and supply status.
- Reports can be exported in Excel.
- Invoice/challan PDFs can be generated.
- The system is protected with role-based login and secure APIs.

## 11. Future Enhancement Suggestions

The following items can be considered in the next version:

- Live GST/tax calculation rules.
- Stock/inventory quantity deduction.
- Payment tracking.
- Customer credit limit management.
- Advanced invoice numbering series.
- SMS or WhatsApp notifications.
- Advanced analytics dashboard.
- Production deployment with SSL and domain setup.
- User activity logs and audit history screens.
- Full accounting ledger module.

## 12. Simple Summary For Client

The MACO ERP System is now developed as a centralized online portal for managing customer accounts, product/item data, customer orders, approval workflow, challans, supply tracking, reports, and documents. It allows customers to place orders online and allows MACO admin users to manage and process those orders from one system. The project improves data organization, reduces manual work, provides better order visibility, and prepares the business for a more complete ERP workflow in future phases.
