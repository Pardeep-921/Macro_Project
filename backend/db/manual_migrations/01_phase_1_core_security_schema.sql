-- Phase 1: Core security/account schema from the MACO ERP roadmap.
--
-- Purpose:
-- - Move authentication toward the roadmap `companies` account model.
-- - Keep the current legacy company fields (`companyId`, `name`, `contact`) during migration.
-- - Preserve compatibility with the existing `users` table until later phases remove old paths.
--
-- Safe local workflow:
-- 1. Back up the local database.
-- 2. Run this file once.
-- 3. Start the backend; `backend/db/init.js` will seed default company login accounts if missing.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS company_id_code VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS username VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS contact_no VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS address_1 TEXT NULL,
  ADD COLUMN IF NOT EXISTS address_2 TEXT NULL,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(10) NULL,
  ADD COLUMN IF NOT EXISTS fax VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS ecc_no VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS services_tax_no VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS pan_no VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS registration_no VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS tin_no VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS cst_no VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS role_master VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

UPDATE companies
SET
  company_id_code = COALESCE(company_id_code, companyId),
  company_name = COALESCE(company_name, name),
  contact_no = COALESCE(contact_no, contact),
  is_active = COALESCE(is_active, isActive, 1)
WHERE company_id_code IS NULL
   OR company_name IS NULL
   OR contact_no IS NULL;

CREATE UNIQUE INDEX uq_companies_company_id_code ON companies (company_id_code);
CREATE UNIQUE INDEX uq_companies_username ON companies (username);
CREATE INDEX idx_company_role ON companies (role_master);
CREATE INDEX idx_company_active ON companies (is_active);

-- The application normalizes these roadmap values internally:
-- ADMIN, CUSTOMER
