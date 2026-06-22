'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const { createPoolFromEnv } = require('./mysql');

async function ensureColumns(pool) {
  const addColumnIfMissing = async (tableName, columns, columnName, definition) => {
    if (!columns.some((c) => c.Field === columnName)) {
      console.log(`Adding "${columnName}" column to ${tableName} table...`);
      await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
      columns.push({ Field: columnName });
    }
  };

  // Check if status and createdAt columns exist in users table
  const [columns] = await pool.query('SHOW COLUMNS FROM users');
  const hasStatus = columns.some(c => c.Field === 'status');
  const hasCreatedAt = columns.some(c => c.Field === 'createdAt');

  if (!hasStatus) {
    console.log('Adding "status" column to users table...');
    await pool.query("ALTER TABLE users ADD COLUMN status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved'");
  }
  if (!hasCreatedAt) {
    console.log('Adding "createdAt" column to users table...');
    await pool.query("ALTER TABLE users ADD COLUMN createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  }

  const [prodColumns] = await pool.query('SHOW COLUMNS FROM products');
  const hasItemCode = prodColumns.some(c => c.Field === 'itemCode');
  const hasMrp = prodColumns.some(c => c.Field === 'mrp');

  if (!hasItemCode) {
    console.log('Adding "itemCode" column to products table...');
    await pool.query("ALTER TABLE products ADD COLUMN itemCode VARCHAR(50) UNIQUE NULL");
  }
  if (!hasMrp) {
    console.log('Adding "mrp" column to products table...');
    await pool.query("ALTER TABLE products ADD COLUMN mrp DECIMAL(15,2) DEFAULT 0.00");
  }

  const hasSupplier = prodColumns.some(c => c.Field === 'supplier_name');
  if (!hasSupplier) {
    console.log('Adding B2B columns to products table...');
    await pool.query("ALTER TABLE products ADD COLUMN supplier_name VARCHAR(255) NULL");
    await pool.query("ALTER TABLE products ADD COLUMN location VARCHAR(255) NULL");
    await pool.query("ALTER TABLE products ADD COLUMN experience_years INT DEFAULT 0");
    await pool.query("ALTER TABLE products ADD COLUMN phone VARCHAR(64) NULL");
  }

  const [orderColumns] = await pool.query('SHOW COLUMNS FROM orders');
  const hasPaymentStatus = orderColumns.some(c => c.Field === 'paymentStatus');
  const hasTrackingNo = orderColumns.some(c => c.Field === 'trackingNo');

  if (!hasPaymentStatus) {
    console.log('Adding "paymentStatus" column to orders table...');
    await pool.query("ALTER TABLE orders ADD COLUMN paymentStatus VARCHAR(50) DEFAULT 'Unpaid'");
  }
  if (!hasTrackingNo) {
    console.log('Adding "trackingNo" column to orders table...');
    await pool.query("ALTER TABLE orders ADD COLUMN trackingNo VARCHAR(100) NULL");
  }
  await addColumnIfMissing('orders', orderColumns, 'order_no', 'order_no VARCHAR(100) NULL');
  await addColumnIfMissing('orders', orderColumns, 'company_id', 'company_id BIGINT UNSIGNED NULL');
  await addColumnIfMissing('orders', orderColumns, 'requisition_no', 'requisition_no VARCHAR(100) NULL');
  await addColumnIfMissing('orders', orderColumns, 'po_date', 'po_date DATE NULL');
  await addColumnIfMissing('orders', orderColumns, 'net_amount', 'net_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00');
  await addColumnIfMissing('orders', orderColumns, 'order_status', "order_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'");
  await addColumnIfMissing('orders', orderColumns, 'review_date', 'review_date TIMESTAMP NULL');
  await addColumnIfMissing('orders', orderColumns, 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await addColumnIfMissing('orders', orderColumns, 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  await pool.query("UPDATE orders SET order_no = orderNo WHERE order_no IS NULL AND orderNo IS NOT NULL");
  await pool.query("UPDATE orders SET requisition_no = requisition WHERE requisition_no IS NULL AND requisition IS NOT NULL");
  await pool.query("UPDATE orders SET net_amount = CAST(amount AS DECIMAL(15,2)) WHERE (net_amount IS NULL OR net_amount = 0) AND amount REGEXP '^[0-9]+(\\\\.[0-9]+)?$'");
  await pool.query(`
    UPDATE orders
    SET order_status = CASE UPPER(status)
      WHEN 'ACCEPTED' THEN 'ACCEPTED'
      WHEN 'REJECTED' THEN 'REJECTED'
      WHEN 'DISPATCHED' THEN 'DISPATCHED'
      ELSE 'PENDING'
    END
    WHERE status IS NOT NULL
  `);

  const [orderIndexes] = await pool.query('SHOW INDEX FROM orders');
  if (!orderIndexes.some((idx) => idx.Key_name === 'uq_orders_order_no')) {
    await pool.query('ALTER TABLE orders ADD UNIQUE KEY uq_orders_order_no (order_no)');
  }
  if (!orderIndexes.some((idx) => idx.Key_name === 'idx_order_company')) {
    await pool.query('ALTER TABLE orders ADD INDEX idx_order_company (company_id)');
  }
  if (!orderIndexes.some((idx) => idx.Key_name === 'idx_order_status_roadmap')) {
    await pool.query('ALTER TABLE orders ADD INDEX idx_order_status_roadmap (order_status)');
  }

  const [orderItemColumns] = await pool.query('SHOW COLUMNS FROM order_items');
  await addColumnIfMissing('order_items', orderItemColumns, 'order_id', 'order_id BIGINT UNSIGNED NULL');
  await addColumnIfMissing('order_items', orderItemColumns, 'item_id', 'item_id BIGINT UNSIGNED NULL');
  await addColumnIfMissing('order_items', orderItemColumns, 'size_id', 'size_id INT UNSIGNED NULL');
  await addColumnIfMissing('order_items', orderItemColumns, 'unit_price', 'unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00');
  await addColumnIfMissing('order_items', orderItemColumns, 'total_price', 'total_price DECIMAL(15,2) NOT NULL DEFAULT 0.00');
  await addColumnIfMissing('order_items', orderItemColumns, 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await pool.query(`
    UPDATE order_items oi
    JOIN orders o ON o.orderNo = oi.orderNo
    SET oi.order_id = o.id
    WHERE oi.order_id IS NULL
  `);
  await pool.query("UPDATE order_items SET unit_price = CAST(price AS DECIMAL(12,2)) WHERE (unit_price IS NULL OR unit_price = 0) AND price REGEXP '^[0-9]+(\\\\.[0-9]+)?$'");
  await pool.query('UPDATE order_items SET total_price = unit_price * quantity WHERE total_price IS NULL OR total_price = 0');

  const [orderItemIndexes] = await pool.query('SHOW INDEX FROM order_items');
  if (!orderItemIndexes.some((idx) => idx.Key_name === 'idx_order_items_order_id')) {
    await pool.query('ALTER TABLE order_items ADD INDEX idx_order_items_order_id (order_id)');
  }
  if (!orderItemIndexes.some((idx) => idx.Key_name === 'idx_order_items_item_id')) {
    await pool.query('ALTER TABLE order_items ADD INDEX idx_order_items_item_id (item_id)');
  }

  const [supplyColumns] = await pool.query('SHOW COLUMNS FROM supply_challans');
  await addColumnIfMissing('supply_challans', supplyColumns, 'challan_no', 'challan_no VARCHAR(100) NULL');
  await addColumnIfMissing('supply_challans', supplyColumns, 'order_id', 'order_id BIGINT UNSIGNED NULL');
  await addColumnIfMissing('supply_challans', supplyColumns, 'company_id', 'company_id BIGINT UNSIGNED NULL');
  await addColumnIfMissing('supply_challans', supplyColumns, 'carrier_id', 'carrier_id INT UNSIGNED NULL');
  await addColumnIfMissing('supply_challans', supplyColumns, 'challan_date', 'challan_date DATE NULL');
  await addColumnIfMissing('supply_challans', supplyColumns, 'supply_details', 'supply_details TEXT NULL');
  await addColumnIfMissing('supply_challans', supplyColumns, 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await addColumnIfMissing('supply_challans', supplyColumns, 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  await pool.query('UPDATE supply_challans SET challan_no = challanNo WHERE challan_no IS NULL AND challanNo IS NOT NULL');
  await pool.query('UPDATE supply_challans SET challan_date = challanDate WHERE challan_date IS NULL AND challanDate IS NOT NULL');
  await pool.query(`
    UPDATE supply_challans sc
    JOIN companies c ON c.company_id_code = sc.companyId
    SET sc.company_id = c.id
    WHERE sc.company_id IS NULL
  `);

  const [supplyIndexes] = await pool.query('SHOW INDEX FROM supply_challans');
  if (!supplyIndexes.some((idx) => idx.Key_name === 'idx_challan_no')) {
    await pool.query('ALTER TABLE supply_challans ADD INDEX idx_challan_no (challan_no)');
  }
  if (!supplyIndexes.some((idx) => idx.Key_name === 'idx_challan_company')) {
    await pool.query('ALTER TABLE supply_challans ADD INDEX idx_challan_company (company_id)');
  }
  if (!supplyIndexes.some((idx) => idx.Key_name === 'idx_challan_order')) {
    await pool.query('ALTER TABLE supply_challans ADD INDEX idx_challan_order (order_id)');
  }

  const [companyColumns] = await pool.query('SHOW COLUMNS FROM companies');
  await addColumnIfMissing('companies', companyColumns, 'company_id_code', 'company_id_code VARCHAR(50) NULL');
  await addColumnIfMissing('companies', companyColumns, 'company_name', 'company_name VARCHAR(150) NULL');
  await addColumnIfMissing('companies', companyColumns, 'username', 'username VARCHAR(50) NULL');
  await addColumnIfMissing('companies', companyColumns, 'password_hash', 'password_hash VARCHAR(255) NULL');
  await addColumnIfMissing('companies', companyColumns, 'first_name', 'first_name VARCHAR(100) NULL');
  await addColumnIfMissing('companies', companyColumns, 'last_name', 'last_name VARCHAR(100) NULL');
  await addColumnIfMissing('companies', companyColumns, 'contact_no', 'contact_no VARCHAR(20) NULL');
  await addColumnIfMissing('companies', companyColumns, 'address_1', 'address_1 TEXT NULL');
  await addColumnIfMissing('companies', companyColumns, 'address_2', 'address_2 TEXT NULL');
  await addColumnIfMissing('companies', companyColumns, 'city', 'city VARCHAR(100) NULL');
  await addColumnIfMissing('companies', companyColumns, 'state', 'state VARCHAR(100) NULL');
  await addColumnIfMissing('companies', companyColumns, 'pincode', 'pincode VARCHAR(10) NULL');
  await addColumnIfMissing('companies', companyColumns, 'fax', 'fax VARCHAR(50) NULL');
  await addColumnIfMissing('companies', companyColumns, 'ecc_no', 'ecc_no VARCHAR(100) NULL');
  await addColumnIfMissing('companies', companyColumns, 'services_tax_no', 'services_tax_no VARCHAR(100) NULL');
  await addColumnIfMissing('companies', companyColumns, 'pan_no', 'pan_no VARCHAR(50) NULL');
  await addColumnIfMissing('companies', companyColumns, 'registration_no', 'registration_no VARCHAR(100) NULL');
  await addColumnIfMissing('companies', companyColumns, 'tin_no', 'tin_no VARCHAR(50) NULL');
  await addColumnIfMissing('companies', companyColumns, 'cst_no', 'cst_no VARCHAR(50) NULL');
  await addColumnIfMissing('companies', companyColumns, 'role_master', "role_master VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER'");
  await addColumnIfMissing('companies', companyColumns, 'is_active', 'is_active TINYINT(1) NOT NULL DEFAULT 1');
  await addColumnIfMissing('companies', companyColumns, 'created_at', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await addColumnIfMissing('companies', companyColumns, 'updated_at', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  const [companyIndexes] = await pool.query('SHOW INDEX FROM companies');
  const hasIndex = (keyName) => companyIndexes.some((idx) => idx.Key_name === keyName);
  if (!hasIndex('uq_companies_company_id_code')) {
    await pool.query('ALTER TABLE companies ADD UNIQUE KEY uq_companies_company_id_code (company_id_code)');
  }
  if (!hasIndex('uq_companies_username')) {
    await pool.query('ALTER TABLE companies ADD UNIQUE KEY uq_companies_username (username)');
  }
  if (!hasIndex('idx_company_role')) {
    await pool.query('ALTER TABLE companies ADD INDEX idx_company_role (role_master)');
  }
  if (!hasIndex('idx_company_active')) {
    await pool.query('ALTER TABLE companies ADD INDEX idx_company_active (is_active)');
  }

  await pool.query(`
    UPDATE orders
    SET company_id = (
      SELECT id FROM companies
      WHERE username = 'customer'
      ORDER BY id
      LIMIT 1
    )
    WHERE (company_id IS NULL OR customer = 'SELF TRADING COMPANY')
      AND EXISTS (SELECT 1 FROM companies WHERE username = 'customer')
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS primary_groups (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      group_name VARCHAR(100) NOT NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_primary_groups_group_name (group_name)
    ) ENGINE=InnoDB
  `);

  await pool.query(`
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
    ) ENGINE=InnoDB
  `);

  const [unitColumns] = await pool.query('SHOW COLUMNS FROM item_units');
  await addColumnIfMissing('item_units', unitColumns, 'unit_name', 'unit_name VARCHAR(50) NULL');
  await addColumnIfMissing('item_units', unitColumns, 'description', 'description VARCHAR(150) NULL');
  await pool.query('UPDATE item_units SET unit_name = name WHERE unit_name IS NULL AND name IS NOT NULL');

  const [unitIndexes] = await pool.query('SHOW INDEX FROM item_units');
  if (!unitIndexes.some((idx) => idx.Key_name === 'uq_item_units_unit_name')) {
    await pool.query('ALTER TABLE item_units ADD UNIQUE KEY uq_item_units_unit_name (unit_name)');
  }

  const [sizeColumns] = await pool.query('SHOW COLUMNS FROM item_sizes');
  await addColumnIfMissing('item_sizes', sizeColumns, 'size_code', 'size_code VARCHAR(30) NULL');
  await addColumnIfMissing('item_sizes', sizeColumns, 'description', 'description VARCHAR(150) NULL');
  await pool.query('UPDATE item_sizes SET size_code = name WHERE size_code IS NULL AND name IS NOT NULL');

  const [sizeIndexes] = await pool.query('SHOW INDEX FROM item_sizes');
  if (!sizeIndexes.some((idx) => idx.Key_name === 'uq_item_sizes_size_code')) {
    await pool.query('ALTER TABLE item_sizes ADD UNIQUE KEY uq_item_sizes_size_code (size_code)');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shipping_carriers (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      method_name VARCHAR(150) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await pool.query(`
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
      INDEX idx_item_name (item_name),
      INDEX idx_item_groups (primary_group_id, sub_group_id),
      INDEX idx_item_active (is_active),
      CONSTRAINT fk_items_primary_group FOREIGN KEY (primary_group_id) REFERENCES primary_groups(id) ON DELETE RESTRICT,
      CONSTRAINT fk_items_sub_group FOREIGN KEY (sub_group_id) REFERENCES sub_groups(id) ON DELETE RESTRICT,
      CONSTRAINT fk_items_size FOREIGN KEY (item_size_id) REFERENCES item_sizes(id) ON DELETE RESTRICT,
      CONSTRAINT fk_items_unit FOREIGN KEY (unit_id) REFERENCES item_units(id) ON DELETE RESTRICT,
      CONSTRAINT fk_items_alternate_unit FOREIGN KEY (alternate_unit_id) REFERENCES item_units(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);
}

async function ensureSchema(pool) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf8');
  await pool.query(sql);
  await ensureColumns(pool);
}

async function seedIfEmpty(pool) {
  const ensureCompanyAccount = async ({ companyId, companyName, username, email, password, roleMaster }) => {
    const [[{ c }]] = await pool.query(
      'SELECT COUNT(*) AS c FROM companies WHERE username = ? OR company_id_code = ?',
      [username, companyId]
    );
    if (c > 0) return;

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.execute(
      `INSERT INTO companies (
        companyId, name, company_id_code, company_name, username, password_hash,
        first_name, email, contact, contact_no, address_1, city, state, pincode,
        role_master, isActive, is_active
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        companyId,
        companyName,
        companyId,
        companyName,
        username,
        passwordHash,
        companyName,
        email,
        '9876543210',
        '9876543210',
        'MACO ERP Local Seed Address',
        'New Delhi',
        'Delhi',
        '110001',
        roleMaster,
        1,
        1,
      ]
    );
  };

    const [[{ c: userCount }]] = await pool.query('SELECT COUNT(*) AS c FROM users');
  if (userCount === 0) {
    const hashedAdminPassword = await bcrypt.hash('admin', 10);
    const hashedCustomerPassword = await bcrypt.hash('customer', 10);
    
    // CHANGED: added status='approved' for seeded users
    await pool.execute(
      'INSERT INTO users (username, fullname, email, password_hash, role, status) VALUES (?,?,?,?,?,?)',
      ['admin', 'Admin User', 'admin@maco.com', hashedAdminPassword, 'admin', 'approved']
    );
    await pool.execute(
      'INSERT INTO users (username, fullname, email, password_hash, role, status) VALUES (?,?,?,?,?,?)',
      ['customer', 'Customer User', 'customer@maco.com', hashedCustomerPassword, 'customer', 'approved']
    );

    const categories = [
      'Clutch Assembly', 'Pressure Plate', 'Engine Valves', 'Clutch Plates',
      'Piston Pins', 'Crank Shafts', 'Crank Pins', 'Connecting Rod Kits',
      'Brake Pads', 'Brake Shoes', 'Brake Shoes 2nd'
    ];

    const [[{ c: catCount }]] = await pool.query('SELECT COUNT(*) AS c FROM product_categories');
    if (catCount === 0) {
      for (const cat of categories) {
        await pool.execute('INSERT INTO product_categories (name) VALUES (?)', [cat]);
      }
    }

    const [[{ c: prodCount }]] = await pool.query('SELECT COUNT(*) AS c FROM products');
    if (prodCount === 0) {
      await pool.execute(
        'INSERT INTO products (name, category_id, description, uom, rate, image_url, supplier_name, location, experience_years, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['Heavy Duty Clutch Plate', 4, 'High performance clutch plate\nPrecision Engineered\nLong Life Durability', 'PCS', 1250.00, 'https://picsum.photos/400/300?1', 'Maco Automotive Pvt Ltd', 'New Delhi, India', 15, '9876543210']
      );
      await pool.execute(
        'INSERT INTO products (name, category_id, description, uom, rate, image_url, supplier_name, location, experience_years, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['Premium Engine Valve', 3, 'Heat-treated engine valves\nSuperior Heat Resistance\nOEM Quality Standard', 'SET', 450.00, 'https://picsum.photos/400/300?2', 'Auto Spare Parts Corp', 'Gurgaon, Haryana', 10, '9123456789']
      );
    }
  }

  const [[{ c: companyCount }]] = await pool.query('SELECT COUNT(*) AS c FROM companies');
  if (companyCount === 0) {
    await pool.execute(
      `INSERT INTO companies (
        companyId, name, company_id_code, company_name, email, contact, contact_no,
        address_1, city, state, pincode, role_master, isActive, is_active
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        'CO1001',
        'Self Trading Company',
        'CO1001',
        'Self Trading Company',
        'info@selftrading.com',
        '9876543210',
        '9876543210',
        'Seed Address',
        'New Delhi',
        'Delhi',
        '110001',
        'CUSTOMER',
        1,
        1,
      ]
    );
  }

  await ensureCompanyAccount({
    companyId: 'MACO-ADMIN',
    companyName: 'MACO Administrator',
    username: 'admin',
    email: 'admin@maco.com',
    password: 'admin',
    roleMaster: 'ADMIN',
  });

  await ensureCompanyAccount({
    companyId: 'M10001',
    companyName: 'Customer User',
    username: 'customer',
    email: 'customer@maco.com',
    password: 'customer',
    roleMaster: 'CUSTOMER',
  });

  const [[{ c: primaryGroupCount }]] = await pool.query('SELECT COUNT(*) AS c FROM primary_groups');
  if (primaryGroupCount === 0) {
    const [legacyPrimaryItems] = await pool.query('SELECT name, item_desc FROM primary_items ORDER BY name LIMIT 50');
    if (legacyPrimaryItems.length > 0) {
      for (const item of legacyPrimaryItems) {
        await pool.execute(
          'INSERT IGNORE INTO primary_groups (group_name, description) VALUES (?, ?)',
          [item.name, item.item_desc || null]
        );
      }
    } else {
      await pool.execute(
        'INSERT INTO primary_groups (group_name, description) VALUES (?, ?)',
        ['Piston Pins', 'Seeded roadmap primary group for Phase 2 masters']
      );
    }
  }

  const [[{ c: subGroupCount }]] = await pool.query('SELECT COUNT(*) AS c FROM sub_groups');
  if (subGroupCount === 0) {
    const [[defaultGroup]] = await pool.query('SELECT id FROM primary_groups ORDER BY id LIMIT 1');
    if (defaultGroup) {
      const [legacyCategories] = await pool.query('SELECT name FROM product_categories ORDER BY name LIMIT 50');
      if (legacyCategories.length > 0) {
        for (const category of legacyCategories) {
          await pool.execute(
            'INSERT IGNORE INTO sub_groups (sub_group_name, primary_group_id, chapter_heading_no) VALUES (?, ?, ?)',
            [category.name, defaultGroup.id, null]
          );
        }
      } else {
        await pool.execute(
          'INSERT INTO sub_groups (sub_group_name, primary_group_id, chapter_heading_no) VALUES (?, ?, ?)',
          ['Lorries & Trucks', defaultGroup.id, 'HS-8708']
        );
      }
    }
  }

  const [[{ c: unitCount }]] = await pool.query('SELECT COUNT(*) AS c FROM item_units WHERE unit_name IS NOT NULL');
  if (unitCount === 0) {
    const units = [
      ['PCS', 'Pieces'],
      ['SET', 'Set'],
      ['BOX', 'Box'],
    ];
    for (const [name, description] of units) {
      await pool.execute(
        'INSERT IGNORE INTO item_units (name, unit_name, description) VALUES (?, ?, ?)',
        [name, name, description]
      );
    }
  }

  const [[{ c: sizeCount }]] = await pool.query('SELECT COUNT(*) AS c FROM item_sizes WHERE size_code IS NOT NULL');
  if (sizeCount === 0) {
    const sizes = [
      ['STD', 'Standard'],
      ['001', 'First oversize'],
      ['002', 'Second oversize'],
    ];
    for (const [name, description] of sizes) {
      await pool.execute(
        'INSERT IGNORE INTO item_sizes (name, size_code, description) VALUES (?, ?, ?)',
        [name, name, description]
      );
    }
  }

  const [[{ c: carrierCount }]] = await pool.query('SELECT COUNT(*) AS c FROM shipping_carriers');
  if (carrierCount === 0) {
    const carriers = ['SAI GOODS CARRIER', 'ATUL CARRIER', 'V-TRANS LTD.', 'NITCO ROADWAYS', 'SAURASHTRA ROADWAYS'];
    for (const carrier of carriers) {
      await pool.execute('INSERT IGNORE INTO shipping_carriers (method_name) VALUES (?)', [carrier]);
    }
  }

  const [[{ c: itemCount }]] = await pool.query('SELECT COUNT(*) AS c FROM items');
  if (itemCount === 0) {
    const [[defaultGroup]] = await pool.query('SELECT id FROM primary_groups ORDER BY id LIMIT 1');
    const [[defaultSubGroup]] = await pool.query('SELECT id FROM sub_groups ORDER BY id LIMIT 1');
    const [[defaultSize]] = await pool.query('SELECT id FROM item_sizes WHERE size_code IS NOT NULL ORDER BY id LIMIT 1');
    const [[defaultUnit]] = await pool.query('SELECT id FROM item_units WHERE unit_name IS NOT NULL ORDER BY id LIMIT 1');

    if (defaultGroup && defaultSubGroup && defaultSize && defaultUnit) {
      const [legacyProducts] = await pool.query('SELECT id, itemCode, name, rate, mrp FROM products ORDER BY id LIMIT 100');
      if (legacyProducts.length > 0) {
        for (const product of legacyProducts) {
          const code = product.itemCode || `LEGACY-${product.id}`;
          await pool.execute(
            `INSERT IGNORE INTO items (
              item_code, item_name, primary_group_id, sub_group_id, item_size_id,
              unit_id, list_price, mrp, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              code,
              product.name,
              defaultGroup.id,
              defaultSubGroup.id,
              defaultSize.id,
              defaultUnit.id,
              product.rate || 0,
              product.mrp || product.rate || 0,
            ]
          );
        }
      } else {
        await pool.execute(
          `INSERT INTO items (
            item_code, item_name, primary_group_id, sub_group_id, item_size_id,
            unit_id, list_price, mrp, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          ['AC-020', 'PP Atlas Copco', defaultGroup.id, defaultSubGroup.id, defaultSize.id, defaultUnit.id, 1250.00, 1450.00]
        );
      }
    }
  }

  const [[{ c: leadCount }]] = await pool.query('SELECT COUNT(*) AS c FROM leads');
  if (leadCount === 0) {
    await pool.execute(
      'INSERT INTO leads (name, email, phone, status, companyId, userId) VALUES (?,?,?,?,?,?)',
      ['John Doe', 'john@example.com', '1234567890', 'New', 1, 1]
    );
  }

  const [[{ c: orderCount }]] = await pool.query('SELECT COUNT(*) AS c FROM orders');
  if (orderCount === 0) {
    const [[customerCompany]] = await pool.query(
      "SELECT id FROM companies WHERE username = 'customer' ORDER BY id LIMIT 1"
    );
    await pool.execute(
      `INSERT INTO orders (
        orderNo, order_no, userId, company_id, customer, requisition, requisition_no,
        poDate, destination, amount, net_amount, status, order_status, acceptDate, pdf
      ) VALUES
        (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?),
        (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?),
        (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        'M10001',
        'M10001',
        1,
        customerCompany?.id || null,
        'SELF TRADING COMPANY',
        '123',
        '123',
        '26-02-2014',
        'Sonipat',
        '847500',
        847500,
        'Pending',
        'PENDING',
        '',
        'PDF',
        'M10002',
        'M10002',
        1,
        customerCompany?.id || null,
        'SELF TRADING COMPANY',
        '124',
        '124',
        '26-02-2014',
        'Sonipat',
        '548600',
        548600,
        'Accepted',
        'ACCEPTED',
        '27-02-2014',
        'PDF',
        'M10003',
        'M10003',
        1,
        customerCompany?.id || null,
        'SELF TRADING COMPANY',
        '125',
        '125',
        '26-02-2014',
        'Sonipat',
        '155850',
        155850,
        'Rejected',
        'REJECTED',
        '27-02-2014',
        'PDF',
      ]
    );
  }
}

async function initDb() {
  const pool = createPoolFromEnv();
  await ensureSchema(pool);
  await seedIfEmpty(pool);
  return pool;
}

module.exports = { initDb, ensureSchema, seedIfEmpty };

