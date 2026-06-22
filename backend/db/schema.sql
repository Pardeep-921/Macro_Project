CREATE TABLE IF NOT EXISTS product_categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cat_name (name)
);

CREATE TABLE IF NOT EXISTS item_units (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NULL UNIQUE,
  unit_name VARCHAR(50) NULL UNIQUE,
  description VARCHAR(150) NULL
);

CREATE TABLE IF NOT EXISTS item_sizes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NULL UNIQUE,
  size_code VARCHAR(30) NULL UNIQUE,
  description VARCHAR(150) NULL
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  itemCode VARCHAR(50) UNIQUE NULL,
  name VARCHAR(255) NOT NULL,
  category_id INT UNSIGNED NULL,
  description TEXT NULL,
  uom VARCHAR(32) DEFAULT 'PCS',
  rate DECIMAL(15,2) DEFAULT 0.00,
  mrp DECIMAL(15,2) DEFAULT 0.00,
  image_url VARCHAR(512) NULL,
  supplier_name VARCHAR(255) NULL,
  location VARCHAR(255) NULL,
  experience_years INT DEFAULT 0,
  phone VARCHAR(64) NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL,
  fullname VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','customer') NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved', -- NEW: approval-based access
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                             -- NEW: registration timestamp
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username)
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  orderNo VARCHAR(64) NOT NULL,
  order_no VARCHAR(100) NULL,
  userId BIGINT UNSIGNED NULL,
  company_id BIGINT UNSIGNED NULL,
  customer VARCHAR(255) NOT NULL,
  requisition VARCHAR(255) NULL,
  requisition_no VARCHAR(100) NULL,
  poDate VARCHAR(64) NULL,
  po_date DATE NULL,
  destination VARCHAR(255) NULL,
  amount VARCHAR(64) NULL,
  net_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) NOT NULL DEFAULT 'Pending',
  order_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  acceptDate VARCHAR(64) NULL,
  review_date TIMESTAMP NULL,
  pdf VARCHAR(255) NULL,
  paymentStatus VARCHAR(50) DEFAULT 'Unpaid',
  trackingNo VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_orderNo (orderNo),
  UNIQUE KEY uq_orders_order_no (order_no),
  INDEX idx_orders_status (status),
  INDEX idx_order_company (company_id),
  INDEX idx_order_status_roadmap (order_status),
  CONSTRAINT fk_orders_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- NEW: Supply & Challan Tracking
CREATE TABLE IF NOT EXISTS supply_challans (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  challanNo VARCHAR(50) UNIQUE NOT NULL,
  challan_no VARCHAR(100) NULL,
  companyId VARCHAR(50) NOT NULL,
  company_id BIGINT UNSIGNED NULL,
  order_id BIGINT UNSIGNED NULL,
  carrier_id INT UNSIGNED NULL,
  challanDate DATE NOT NULL,
  challan_date DATE NULL,
  supply_details TEXT NULL,
  uploadedBy BIGINT UNSIGNED,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_challan_no (challan_no),
  INDEX idx_challan_company (company_id),
  INDEX idx_challan_order (order_id)
);

CREATE TABLE IF NOT EXISTS supply_details (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  challanNo VARCHAR(50) NOT NULL,
  itemName VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  uom VARCHAR(20),
  FOREIGN KEY (challanNo) REFERENCES supply_challans(challanNo) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS companies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  companyId VARCHAR(64) NULL,
  name VARCHAR(255) NULL,
  company_id_code VARCHAR(50) NULL,
  company_name VARCHAR(150) NULL,
  username VARCHAR(50) NULL,
  password_hash VARCHAR(255) NULL,
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  email VARCHAR(255) NULL,
  contact VARCHAR(64) NULL,
  contact_no VARCHAR(20) NULL,
  address_1 TEXT NULL,
  address_2 TEXT NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  pincode VARCHAR(10) NULL,
  fax VARCHAR(50) NULL,
  ecc_no VARCHAR(100) NULL,
  services_tax_no VARCHAR(100) NULL,
  pan_no VARCHAR(50) NULL,
  registration_no VARCHAR(100) NULL,
  tin_no VARCHAR(50) NULL,
  cst_no VARCHAR(50) NULL,
  role_master VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_companies_company_id_code (company_id_code),
  UNIQUE KEY uq_companies_username (username),
  INDEX idx_company_code (company_id_code),
  INDEX idx_username (username),
  INDEX idx_company_role (role_master),
  INDEX idx_company_active (is_active),
  INDEX idx_companies_active (isActive)
);

CREATE TABLE IF NOT EXISTS primary_items (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  item_desc TEXT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS primary_groups (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  group_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_primary_groups_group_name (group_name)
);

CREATE TABLE IF NOT EXISTS sub_groups (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sub_group_name VARCHAR(100) NOT NULL,
  primary_group_id INT UNSIGNED NOT NULL,
  chapter_heading_no VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sub_groups_per_primary (primary_group_id, sub_group_name),
  INDEX idx_sub_groups_primary (primary_group_id),
  CONSTRAINT fk_sub_groups_primary_group FOREIGN KEY (primary_group_id) REFERENCES primary_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shipping_carriers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  method_name VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  primary_group_id INT UNSIGNED NOT NULL,
  sub_group_id INT UNSIGNED NOT NULL,
  item_size_id INT UNSIGNED NOT NULL,
  unit_id INT UNSIGNED NOT NULL,
  alternate_unit_id INT UNSIGNED NULL,
  list_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  mrp DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_items_item_code (item_code),
  INDEX idx_item_code (item_code),
  INDEX idx_item_name (item_name),
  INDEX idx_item_groups (primary_group_id, sub_group_id),
  INDEX idx_item_active (is_active),
  CONSTRAINT fk_items_primary_group FOREIGN KEY (primary_group_id) REFERENCES primary_groups(id) ON DELETE RESTRICT,
  CONSTRAINT fk_items_sub_group FOREIGN KEY (sub_group_id) REFERENCES sub_groups(id) ON DELETE RESTRICT,
  CONSTRAINT fk_items_size FOREIGN KEY (item_size_id) REFERENCES item_sizes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_items_unit FOREIGN KEY (unit_id) REFERENCES item_units(id) ON DELETE RESTRICT,
  CONSTRAINT fk_items_alternate_unit FOREIGN KEY (alternate_unit_id) REFERENCES item_units(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  orderNo VARCHAR(64) NOT NULL,
  order_id BIGINT UNSIGNED NULL,
  productId BIGINT UNSIGNED NULL,
  item_id BIGINT UNSIGNED NULL,
  size_id INT UNSIGNED NULL,
  itemName VARCHAR(255) NOT NULL,
  size VARCHAR(32) NULL,
  quantity INT NOT NULL,
  price VARCHAR(64) NULL,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  uom VARCHAR(32) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_item_id (item_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (orderNo) REFERENCES orders(orderNo) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
);

-- CRM Modules
CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(64) NULL,
  status ENUM('New', 'Contacted', 'Qualified', 'Lost', 'Converted') NOT NULL DEFAULT 'New',
  companyId BIGINT UNSIGNED NULL,
  userId BIGINT UNSIGNED NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_leads_company FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL,
  CONSTRAINT fk_leads_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS deals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) DEFAULT 0.00,
  stage ENUM('Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost') NOT NULL DEFAULT 'Discovery',
  leadId BIGINT UNSIGNED NULL,
  userId BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_deals_lead FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT fk_deals_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  dueDate DATE NULL,
  status ENUM('Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending',
  userId BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_tasks_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

