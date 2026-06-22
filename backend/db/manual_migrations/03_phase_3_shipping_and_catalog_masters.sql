-- Phase 3: Sizes, units, shipping carriers, and item master catalog.
-- Manual migration note:
-- The current app already has `item_units` and `item_sizes` with a `name` column.
-- The roadmap target uses `unit_name` and `size_code`. Convert existing data manually if needed.

CREATE TABLE IF NOT EXISTS item_units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NULL,
    unit_name VARCHAR(50) UNIQUE NULL,
    description VARCHAR(150)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS item_sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NULL,
    size_code VARCHAR(30) UNIQUE NULL,
    description VARCHAR(150)
) ENGINE=InnoDB;

ALTER TABLE item_units ADD COLUMN IF NOT EXISTS unit_name VARCHAR(50) NULL;
ALTER TABLE item_units ADD COLUMN IF NOT EXISTS description VARCHAR(150) NULL;
UPDATE item_units SET unit_name = name WHERE unit_name IS NULL AND name IS NOT NULL;

ALTER TABLE item_sizes ADD COLUMN IF NOT EXISTS size_code VARCHAR(30) NULL;
ALTER TABLE item_sizes ADD COLUMN IF NOT EXISTS description VARCHAR(150) NULL;
UPDATE item_sizes SET size_code = name WHERE size_code IS NULL AND name IS NOT NULL;

CREATE TABLE IF NOT EXISTS shipping_carriers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    method_name VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(100) UNIQUE NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    primary_group_id INT NOT NULL,
    sub_group_id INT NOT NULL,
    item_size_id INT NOT NULL,
    unit_id INT NOT NULL,
    alternate_unit_id INT,
    list_price DECIMAL(12, 2) NOT NULL,
    mrp DECIMAL(12, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (primary_group_id) REFERENCES primary_groups(id) ON DELETE RESTRICT,
    FOREIGN KEY (sub_group_id) REFERENCES sub_groups(id) ON DELETE RESTRICT,
    FOREIGN KEY (item_size_id) REFERENCES item_sizes(id) ON DELETE RESTRICT,
    FOREIGN KEY (unit_id) REFERENCES item_units(id) ON DELETE RESTRICT,
    FOREIGN KEY (alternate_unit_id) REFERENCES item_units(id) ON DELETE SET NULL,
    INDEX idx_item_code (item_code),
    INDEX idx_item_name (item_name),
    INDEX idx_item_groups (primary_group_id, sub_group_id),
    INDEX idx_item_active (is_active)
) ENGINE=InnoDB;
