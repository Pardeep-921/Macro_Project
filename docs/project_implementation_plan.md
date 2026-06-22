# MACO ERP Portal: Architectural Blueprint & Development Roadmap
## Computerized Accounting & Enterprise Resource Planning

This document serves as the comprehensive architectural reference, database schema design, and phase-by-phase implementation roadmap for the **MACO Online ERP Portal**. This plan is modeled directly from the enterprise requirements, database diagrams, and system wireframes provided in the project specification to transition legacy disconnected database systems into a unified, technically modern, and secure B2B ERP.

---

## 1. Executive Summary & Core Value Proposition

Legacy enterprise systems often suffer from **Closed Database Architectures** (as depicted in the legacy block diagrams), where Customer Databases, Manufacturing Databases, and Procurement Databases operate in disconnected silos. This results in data discrepancies, high operational latency, and zero real-time visibility.

The **MACO ERP Portal** introduces an integrated, secure, and modern relational model that bridges these divisions:
*   **Unified Master Data Control**: Centralized management of Companies (Clients), Primary/Sub-Groups, Item Masters, Sizes, and Units.
*   **Frictionless B2B Ordering**: An intuitive client-facing portal that allows customers to search, select, build orders with sizing preferences, and monitor processing in real-time.
*   **Operational Transparency**: End-to-end order state tracking (Pending &rarr; Accepted &rarr; Dispatched/Challan Tracked) with automated invoice printing and spreadsheet export capabilities.
*   **Enterprise-Grade Security**: Strong modern encryption, rate limiting, and Role-Based Access Control (RBAC) separating MACO Administrators from Customer/Company portal accounts.

---

## 2. Technical Stack & Architecture

To build a responsive, robust, and maintains-compliant application, the project uses the following specialized full-stack architecture:

### Frontend Layer
*   **Framework**: **React 19** with **Vite**, **TypeScript**, and **React Router DOM 7**. This enables client-side routing, highly modular views, strict type safety, and instant feedback.
*   **Styling**: **Tailwind CSS**. Fluid responsive utilities for clean dashboards, high-density data tables, sidebars, and control forms.
*   **Animations**: **Motion (Framer Motion)**. Provides subtle micro-interactions, active cart animations, and page-entrance transitions.
*   **Icons**: **Lucide React** for standardized, lightweight, scalable interface icons.

### Backend Application Layer
*   **Runtime & Server**: **Node.js** with **Express 5**. Highly responsive and clean modular RESTful APIs to handle orders, inventory master tables, and logistics.
*   **Process Manager**: **Nodemon** for live, auto-reloading backend development.

### Database & Persistence Layer
*   **Database Engine**: **MySQL** (Local relational database). A relational engine with transaction processing capability is **mandatory** for accurate invoice ledger mappings, double-entry computerized accounting, and supply logistics.
*   **Database Client**: **mysql2**. Connects high-performance Node pool connections directly to the local MySQL database instance with custom SQL execution.

### Security, Authentication & Defense
*   **Password Hashing**: **bcryptjs** (using salted bcrypt hashing) for securing company logins.
*   **Session Management**: State-agnostic **jsonwebtoken (JWT)** access tokens embedded inside requests headers.
*   **Production Hardening**:
    *   **Helmet**: Sets appropriate HTTP security headers to protect against cross-site scripting (XSS) and code injection.
    *   **CORS**: Restricts external app requests to secure valid white-listed domains.
    *   **express-rate-limit**: Defense mechanism against automated endpoint abuse and login brute-force.

### Document Generation & Reporting Tools
*   **Interactive PDF Generation**: **jsPDF** paired with **jsPDF-AutoTable** for client-side rendered, perfectly aligned tabular invoices and bills of lading.
*   **Alternative Server-side PDFs**: **PDFKit** for advanced backend invoice compilations.
*   **Spreadsheet Reporting**: **XLSX (SheetJS)** to export transactional histories, order lists, and supply tracking sheets into valid, raw Excel worksheets (.xlsx) for direct import into Microsoft Excel.
*   **Support & Mail Alerts**: **Nodemailer** for automated dispatch updates, admin contact support, and sign-up notifications.

---

## 3. Unified MySQL Database Schema Design

Below is the relational entity-relationship specification written in standard **MySQL** syntax. It is carefully structured to prevent duplicate duplicate entries, enforce integrity constraints, and provide clean cascading operations.

```sql
-- 1. Companies (Customer Accounts & Admin Credentials)
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., "M10001"
    company_name VARCHAR(150) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100) NOT NULL,
    contact_no VARCHAR(20),
    address_1 TEXT NOT NULL,
    address_2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    fax VARCHAR(50),
    ecc_no VARCHAR(100),
    services_tax_no VARCHAR(100),
    pan_no VARCHAR(50),
    registration_no VARCHAR(100),
    tin_no VARCHAR(50),
    cst_no VARCHAR(50),
    role_master VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER', -- 'ADMIN', 'CUSTOMER'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_company_code (company_id_code),
    INDEX idx_username (username)
) ENGINE=InnoDB;

-- 2. Primary Item Groups
CREATE TABLE primary_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) UNIQUE NOT NULL, -- e.g., "Connecting Rod Kits"
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Sub-Groups
CREATE TABLE sub_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sub_group_name VARCHAR(100) NOT NULL, -- e.g., "CONNECTING RODS 2/W"
    primary_group_id INT NOT NULL,
    chapter_heading_no VARCHAR(100), -- e.g., HS-Codes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (primary_group_id) REFERENCES primary_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Item Units
CREATE TABLE item_units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_name VARCHAR(50) UNIQUE NOT NULL, -- e.g., "PCS", "SET"
    description VARCHAR(150)
) ENGINE=InnoDB;

-- 5. Item Sizes
CREATE TABLE item_sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    size_code VARCHAR(30) UNIQUE NOT NULL, -- e.g., "STD", "001"
    description VARCHAR(150)
) ENGINE=InnoDB;

-- 6. Shipping Carriers (Fulfillment logistics options)
CREATE TABLE shipping_carriers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    method_name VARCHAR(150) UNIQUE NOT NULL, -- e.g., "SAI GOODS CARRIER"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 7. Item Master Catalog
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(100) UNIQUE NOT NULL, -- e.g., "AC-020"
    item_name VARCHAR(150) NOT NULL,       -- e.g., "PP Atlas Copco"
    primary_group_id INT NOT NULL,
    sub_group_id INT NOT NULL,
    item_size_id INT NOT NULL,
    unit_id INT NOT NULL,
    alternate_unit_id INT,
    list_price DECIMAL(12, 2) NOT NULL,
    mrp DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (primary_group_id) REFERENCES primary_groups(id) ON DELETE RESTRICT,
    FOREIGN KEY (sub_group_id) REFERENCES sub_groups(id) ON DELETE RESTRICT,
    FOREIGN KEY (item_size_id) REFERENCES item_sizes(id) ON DELETE RESTRICT,
    FOREIGN KEY (unit_id) REFERENCES item_units(id) ON DELETE RESTRICT,
    FOREIGN KEY (alternate_unit_id) REFERENCES item_units(id) ON DELETE SET NULL,
    INDEX idx_item_code (item_code)
) ENGINE=InnoDB;

-- 8. Customer Orders (Headers)
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(100) UNIQUE NOT NULL, -- e.g., "M10001" sequence check
    company_id INT NOT NULL,
    requisition_no VARCHAR(100),
    po_date DATE,
    destination VARCHAR(150) NOT NULL,
    net_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    order_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
    review_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
    INDEX idx_order_no (order_no)
) ENGINE=InnoDB;

-- 9. Order Items (Lines / Junction Details)
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    size_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
    FOREIGN KEY (size_id) REFERENCES item_sizes(id) ON DELETE RESTRICT,
    CONSTRAINT chk_quantity CHECK (quantity > 0)
) ENGINE=InnoDB;

-- 10. Supply Challans (Logistics Tracking & Delivery Receipts)
CREATE TABLE supply_challans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challan_no VARCHAR(100) UNIQUE NOT NULL,
    order_id INT,
    company_id INT NOT NULL,
    carrier_id INT NOT NULL,
    challan_date DATE NOT NULL,
    supply_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
    FOREIGN KEY (carrier_id) REFERENCES shipping_carriers(id) ON DELETE RESTRICT,
    INDEX idx_challan_no (challan_no)
) ENGINE=InnoDB;
```

---

## 4. Operational Milestones & Development Timeline

The transformation is structured into **6 logical phases** executing sequentially over an **8-week timeline**.

```
+------------------------------------------------------------+
| ROADMAP CHART: 8-WEEK IMPLEMENTATION TIMELINE              |
+------------------------------------------------------------+
| Phase 1: Local DB & Security Shell | W1-W2 : ██████        |
| Phase 2: Company & Group Masters   | W3-W4 :       ████    |
| Phase 3: Shipping & Catalog Master | W4-W5 :         ██    |
| Phase 4: Order System & B2B Cart   | W5-W6 :           ██  |
| Phase 5: Documents, Mail & Excel   | W7    :             █ |
| Phase 6: Audits, QA & local Ready  | W8    :              █|
+------------------------------------------------------------+
```

### Phase 1: Local database Setup & Security Architecture (Weeks 1 - 2)
*   **Database Provisioning**: Install local MySQL instance. Configure the database connection pool using `mysql2` and manage access parameters securely with `dotenv`.
*   **Security Foundation**: Integrate `Helmet` headers, set up white-listed domain limits on `CORS`, and configure rate-limiting policies (`express-rate-limit`) to defend administrative login routes.
*   **Portal Authentication Screen**: Build the black-and-gold **MACO brand interface matrix** using bcryptjs for secure custom logins, issuing state-agnostic secure JSON Web Tokens (JWT).
*   **Interface Shell**: Configure the primary layout frame incorporating sidebar controllers that load panels dynamically according to active role tokens (Administrator vs Customer Accounts).

### Phase 2: Administrative Organization & Groups Configuration (Weeks 3 - 4)
*   **Manage Company Profile Workspace**: Integrated CRUD forms handling extensive tax parameters (PAN, ECC, TIN, GST, CST, Service Tax), address definitions, and user credentials. Feature instant live search options to filter company tables efficiently.
*   **Primary & Sub-group Masters**: Mappings and nested group assignment cards allowing administrators to categorize stock items (e.g., matching sub-categories like *Lorries & Trucks* under master categories like *Piston Pins*) complete with HS chapter titles.

### Phase 3: Logistics Details & Item Catalogs (Weeks 4 - 5)
*   **Metrics & Shipping Logistics Registry**: Setup quick configuration panels for sizes (STD, 001) and unit groupings (PCS, Set). Establish the shipping method manager cataloging partner transportation vectors (e.g., *Atul Carrier*, *V-Trans Ltd.*).
*   **Enterprise Item Master Catalog**: Double-panel controller interface allowing admins to register structural items (e.g., item code *AC-020*, item name *PP Atlas Copco*), assign price indices (List price, MRP), and search entries instantly.

### Phase 4: Customer Custom Ordering, Cart & Status Dashboard (Weeks 5 - 6)
*   **Interactive Shopping Portal**:
    *   Dynamic listing interface showing available parts with multiple filter capabilities.
    *   Inline modal/controls to pick primary metrics, input target quantities, and add items into a fluid checkout basket.
    *   Create client-side cart cache ensuring quick calculations with animated updates via `motion/react`.
*   **Admin Status Hub & Approval Board**:
    *   Dashboard summaries showing dynamic visual indicators for *Pending Orders, Accepted Orders*, and *Rejected Orders*.
    *   Transactional verification desk revealing incoming orders, customer particulars, and dual action commands (**Approve Order** / **Reject Order**).

### Phase 5: PDF Invoicing, Excel Reporting & Mailing (Week 7)
*   **Transactional Invoices (PDF)**: Implement client-side PDF document generation using `jsPDF` and `jsPDF-AutoTable` to compile structured invoices mapping exact layout columns dynamically.
*   **Supply Challan Dispatch logs**: Admin forms log dispatch details (Challans, partner carrier codes, actual dates). Customers can instantly track supply updates on their ledger files.
*   **Excel Export Tooling**: Integrate `XLSX` to instantly pull catalog results or order logs into fully-formed structured spreadsheet reports (.xlsx) for ledger reconciliation.
*   **Automated Portal Alerts**: Incorporate `Nodemailer` to dynamically dispatch email notifications to administrators upon order checkout and send customers shipping updates.

### Phase 6: Core Validation, Quality Assurance & Deployment Prep (Week 8)
*   **SQL Optimization**: Profile SQL queries, optimize connection pooling, and append indices on primary lookup columns (`company_id_code`, `item_code`, `order_no`, `challan_no`).
*   **API Boundary Integrity Checks**: Verify route guards across Express endpoints to confirm standard customer logins can under no circumstance execute schema updates or manage administrative company registers.
*   **Local Launch Review**: Clean stale Nodemon processes, execute database structure checks, and ensure stable local performance.

---

## 5. Architectural & Design Guidelines for Implementors

To ensure high-performance execution of pages and prevent database state issues:

1.  **State Management Guidelines**: Never save client-side order baskets in deep duplicated states. Maintain atomic actions and fetch new table data only on key event changes.
2.  **API Decoupling Policy**: Ensure server-side logic remains separated into specialized routing controllers:
    *   `/src/types/`: Central type definitions for MySQL outputs, API routes, and forms inputs.
    *   `/src/components/shared/`: Shared, standard inputs, buttons, and custom data grids.
    *   `/src/components/admin/`: Admin panels (Manage Company, Primary/Sub-Groups, Masters, Order approvals).
    *   `/src/components/customer/`: Customer-facing storefronts (Shopping cart, Order tracking list, Logistics tracking).
    *   `/server/routes/`: Express endpoint collections separated logically (e.g., `company_routes.js`, `order_routes.js`, `catalog_routes.js`).

---

*This document constitutes the official roadmap blueprint for the MACO computerized ERP transformation project.*

---

## 6. Implementation Tracking

The implementation checklist and phase execution tracker are maintained in:

*   [`phase_implementation_tracker.md`](./phase_implementation_tracker.md)

Manual database migration scripts are maintained in:

*   [`../backend/db/manual_migrations/`](../backend/db/manual_migrations/)

Use those files to choose and execute one phase at a time without changing this architectural blueprint.

Client-facing implementation documentation is maintained in:

*   [`client_project_documentation.md`](./client_project_documentation.md)
