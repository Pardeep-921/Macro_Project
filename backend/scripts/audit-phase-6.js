'use strict';

require('dotenv').config();

const { initDb } = require('../db/init');

const requiredTables = [
  'companies',
  'primary_groups',
  'sub_groups',
  'item_units',
  'item_sizes',
  'shipping_carriers',
  'items',
  'orders',
  'order_items',
  'supply_challans',
];

const requiredIndexes = {
  companies: [
    ['idx_company_code', 'uq_companies_company_id_code'],
    ['idx_username', 'uq_companies_username'],
    'idx_company_role',
    'idx_company_active',
  ],
  items: ['idx_item_code', 'idx_item_groups', 'idx_item_active'],
  orders: ['uq_orders_order_no', 'idx_order_company', 'idx_order_status_roadmap'],
  order_items: ['idx_order_items_order_id', 'idx_order_items_item_id'],
  supply_challans: ['idx_challan_no', 'idx_challan_company', 'idx_challan_order'],
};

async function count(pool, sql, params = []) {
  const [[row]] = await pool.query(sql, params);
  return Number(Object.values(row)[0] || 0);
}

async function getExistingTables(pool) {
  const [rows] = await pool.query('SHOW TABLES');
  return new Set(rows.map((row) => Object.values(row)[0]));
}

async function getIndexes(pool, tableName) {
  const [rows] = await pool.query(`SHOW INDEX FROM ${tableName}`);
  return new Set(rows.map((row) => row.Key_name));
}

function pass(label, detail = '') {
  console.log(`PASS ${label}${detail ? ` - ${detail}` : ''}`);
}

function fail(failures, label, detail) {
  failures.push(`${label}: ${detail}`);
  console.error(`FAIL ${label} - ${detail}`);
}

async function main() {
  const pool = await initDb();
  const failures = [];

  try {
    const connection = await pool.getConnection();
    connection.release();
    pass('MySQL pool connectivity');

    const existingTables = await getExistingTables(pool);
    for (const tableName of requiredTables) {
      if (existingTables.has(tableName)) pass(`table ${tableName}`);
      else fail(failures, `table ${tableName}`, 'missing');
    }

    for (const [tableName, indexNames] of Object.entries(requiredIndexes)) {
      if (!existingTables.has(tableName)) continue;
      const indexes = await getIndexes(pool, tableName);
      for (const requirement of indexNames) {
        const aliases = Array.isArray(requirement) ? requirement : [requirement];
        const found = aliases.find((indexName) => indexes.has(indexName));
        const label = `${tableName}.${aliases[0]}`;
        if (found) pass(`index ${label}`, found === aliases[0] ? '' : `satisfied by ${found}`);
        else fail(failures, `index ${label}`, `missing; accepted names: ${aliases.join(', ')}`);
      }
    }

    const checks = [
      {
        label: 'invalid order statuses',
        sql: "SELECT COUNT(*) AS c FROM orders WHERE order_status NOT IN ('PENDING','ACCEPTED','REJECTED','DISPATCHED')",
      },
      {
        label: 'orders without linked company',
        sql: 'SELECT COUNT(*) AS c FROM orders o LEFT JOIN companies c ON c.id = o.company_id WHERE o.company_id IS NOT NULL AND c.id IS NULL',
      },
      {
        label: 'order lines without linked order',
        sql: 'SELECT COUNT(*) AS c FROM order_items oi LEFT JOIN orders o ON o.id = oi.order_id WHERE oi.order_id IS NOT NULL AND o.id IS NULL',
      },
      {
        label: 'order lines without linked item',
        sql: 'SELECT COUNT(*) AS c FROM order_items oi LEFT JOIN items i ON i.id = oi.item_id WHERE oi.item_id IS NOT NULL AND i.id IS NULL',
      },
      {
        label: 'challans without linked order',
        sql: 'SELECT COUNT(*) AS c FROM supply_challans sc LEFT JOIN orders o ON o.id = sc.order_id WHERE sc.order_id IS NOT NULL AND o.id IS NULL',
      },
      {
        label: 'challans without linked carrier',
        sql: 'SELECT COUNT(*) AS c FROM supply_challans sc LEFT JOIN shipping_carriers c ON c.id = sc.carrier_id WHERE sc.carrier_id IS NOT NULL AND c.id IS NULL',
      },
      {
        label: 'rejected orders with dispatch tracking',
        sql: "SELECT COUNT(*) AS c FROM orders WHERE order_status = 'REJECTED' AND trackingNo IS NOT NULL",
      },
      {
        label: 'dispatched orders without challan',
        sql: "SELECT COUNT(*) AS c FROM orders o LEFT JOIN supply_challans sc ON sc.order_id = o.id WHERE o.order_status = 'DISPATCHED' AND sc.id IS NULL",
      },
    ];

    for (const check of checks) {
      const value = await count(pool, check.sql);
      if (value === 0) pass(check.label);
      else fail(failures, check.label, `${value} record(s) need review`);
    }

    const [{ 0: statusRows }, { 0: catalogRows }] = await Promise.all([
      pool.query('SELECT order_status, COUNT(*) AS order_count FROM orders GROUP BY order_status ORDER BY order_status'),
      pool.query(`
        SELECT i.item_code, i.item_name, pg.group_name, sg.sub_group_name, s.size_code, u.unit_name
        FROM items i
        JOIN primary_groups pg ON pg.id = i.primary_group_id
        JOIN sub_groups sg ON sg.id = i.sub_group_id
        JOIN item_sizes s ON s.id = i.item_size_id
        JOIN item_units u ON u.id = i.unit_id
        ORDER BY i.item_code
        LIMIT 10
      `),
    ]);

    console.log('\nOrder status summary:');
    console.table(statusRows);

    console.log('Catalog join sample:');
    console.table(catalogRows);

    if (failures.length > 0) {
      console.error('\nPhase 6 audit failed:');
      for (const item of failures) console.error(`- ${item}`);
      process.exitCode = 1;
    } else {
      console.log('\nPhase 6 audit passed. Local database is ready for smoke testing.');
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Phase 6 audit crashed:', err);
  process.exitCode = 1;
});
