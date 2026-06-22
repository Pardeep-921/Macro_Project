'use strict';

require('dotenv').config();

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { ensureSchema, seedIfEmpty } = require('../db/init');

const tablesToReset = [
  'supply_details',
  'supply_challans',
  'order_items',
  'orders',
  'items',
  'shipping_carriers',
  'sub_groups',
  'primary_groups',
  'item_units',
  'item_sizes',
  'leads',
  'deals',
  'tasks',
  'companies',
  'users',
  'products',
  'product_categories',
  'primary_items',
];

async function resetDatabase(pool) {
  await ensureSchema(pool);
  await pool.query('SET FOREIGN_KEY_CHECKS=0');
  for (const table of tablesToReset) {
    await pool.query(`TRUNCATE TABLE ${table}`);
  }
  await pool.query('SET FOREIGN_KEY_CHECKS=1');
  await seedIfEmpty(pool);
}

async function login(app, username, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username, password })
    .expect(200);
  return res.body;
}

describe('Phase 6 QA - final MACO ERP workflows', () => {
  let app;
  let pool;
  let adminToken;
  let customerToken;
  let customerCompanyId;

  before(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'phase6_test_secret';
    process.env.AUTH_RATE_LIMIT_MAX = '1000';
    app = require('../server');
    pool = await app.dbReady;
    await resetDatabase(pool);

    const admin = await login(app, 'admin', 'admin');
    const customer = await login(app, 'customer', 'customer');
    adminToken = admin.token;
    customerToken = customer.token;

    const [[company]] = await pool.query("SELECT id FROM companies WHERE username = 'customer' LIMIT 1");
    customerCompanyId = company.id;
  });

  after(async () => {
    if (pool) {
      await resetDatabase(pool);
      await pool.end();
    }
  });

  it('auth issues normalized admin and customer tokens', async () => {
    const admin = await login(app, 'admin', 'admin');
    const customer = await login(app, 'customer', 'customer');

    assert.strictEqual(admin.role, 'admin');
    assert.strictEqual(admin.role_master, 'ADMIN');
    assert.strictEqual(customer.role, 'customer');
    assert.strictEqual(customer.role_master, 'CUSTOMER');
  });

  it('customers cannot execute admin-only schema/master mutations', async () => {
    const endpoints = [
      ['/api/companies', { companyId: 'QA-CO', name: 'QA Co', email: 'qa@example.com' }],
      ['/api/primary-groups', { name: 'QA Primary' }],
      ['/api/sub-groups', { name: 'QA Sub', primary_group_id: 1 }],
      ['/api/products', { item_code: 'QA-ITEM', item_name: 'QA Item' }],
      ['/api/shipping-carriers', { name: 'QA Carrier' }],
    ];

    for (const [url, body] of endpoints) {
      await request(app)
        .post(url)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(body)
        .expect(403);
    }
  });

  it('customer checkout creates a pending order owned by the logged-in company', async () => {
    const catalog = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    assert.ok(catalog.body.length > 0, 'seed catalog should be available');
    const item = catalog.body[0];

    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        requisition_no: 'QA-REQ-001',
        po_date: '2026-06-20',
        destination: 'QA Warehouse',
        items: [{ item_id: item.id, quantity: 2 }],
      })
      .expect(201);

    assert.ok(created.body.orderNo);

    const detail = await request(app)
      .get(`/api/orders/${created.body.orderNo}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    assert.strictEqual(detail.body.order.order_status, 'PENDING');
    assert.strictEqual(Number(detail.body.order.company_id), Number(customerCompanyId));
    assert.strictEqual(detail.body.items.length, 1);
    assert.strictEqual(Number(detail.body.items[0].quantity), 2);
  });

  it('admin review enforces pending-only approval and rejection', async () => {
    const catalog = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    const makeOrder = async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          destination: 'QA Review Desk',
          items: [{ item_id: catalog.body[0].id, quantity: 1 }],
        })
        .expect(201);
      return res.body.orderNo;
    };

    const approvedOrderNo = await makeOrder();
    const rejectedOrderNo = await makeOrder();

    await request(app)
      .post(`/api/orders/${approvedOrderNo}/approve`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    const approved = await request(app)
      .patch(`/api/orders/${approvedOrderNo}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACCEPTED' })
      .expect(200);

    assert.strictEqual(approved.body.order.order_status, 'ACCEPTED');

    await request(app)
      .patch(`/api/orders/${approvedOrderNo}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'REJECTED' })
      .expect(409);

    const rejected = await request(app)
      .patch(`/api/orders/${rejectedOrderNo}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'REJECTED' })
      .expect(200);

    assert.strictEqual(rejected.body.order.order_status, 'REJECTED');

    await request(app)
      .put(`/api/orders/${rejectedOrderNo}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DISPATCHED', trackingNo: 'QA-BAD-DISPATCH' })
      .expect(409);
  });

  it('challan creation requires an accepted order and then moves it to dispatched', async () => {
    const catalog = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    const carriers = await request(app)
      .get('/api/shipping-carriers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const pending = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        destination: 'QA Dispatch Gate',
        items: [{ item_id: catalog.body[0].id, quantity: 1 }],
      })
      .expect(201);

    await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        challan_no: `QA-PENDING-${Date.now()}`,
        order_no: pending.body.orderNo,
        carrier_id: carriers.body[0].id,
        challan_date: '2026-06-20',
      })
      .expect(409);

    await request(app)
      .patch(`/api/orders/${pending.body.orderNo}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACCEPTED' })
      .expect(200);

    const challanNo = `QA-CH-${Date.now()}`;
    await request(app)
      .post('/api/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        challan_no: challanNo,
        order_no: pending.body.orderNo,
        carrier_id: carriers.body[0].id,
        challan_date: '2026-06-20',
        supply_details: 'Phase 6 QA dispatch',
      })
      .expect(201);

    const detail = await request(app)
      .get(`/api/orders/${pending.body.orderNo}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    assert.strictEqual(detail.body.order.order_status, 'DISPATCHED');
    assert.strictEqual(detail.body.order.trackingNo, challanNo);

    const supplies = await request(app)
      .get('/api/supplies')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    assert.ok(supplies.body.some((row) => row.challan_no === challanNo));
  });

  it('admin-only reports and customer-visible exports keep their boundaries', async () => {
    await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    const stats = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    assert.ok(Object.hasOwn(stats.body.stats, 'pending'));
    assert.ok(Object.hasOwn(stats.body.stats, 'dispatched'));

    await request(app)
      .get('/api/exports/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    await request(app)
      .get('/api/exports/catalog')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200)
      .expect('Content-Type', /spreadsheet/);
  });

  it('database has no orphaned roadmap relations after QA workflows', async () => {
    const [[{ invalidOrders }]] = await pool.query(
      "SELECT COUNT(*) AS invalidOrders FROM orders WHERE order_status NOT IN ('PENDING','ACCEPTED','REJECTED','DISPATCHED')"
    );
    const [[{ orphanLines }]] = await pool.query(
      'SELECT COUNT(*) AS orphanLines FROM order_items oi LEFT JOIN orders o ON o.id = oi.order_id WHERE oi.order_id IS NOT NULL AND o.id IS NULL'
    );
    const [[{ orphanItems }]] = await pool.query(
      'SELECT COUNT(*) AS orphanItems FROM order_items oi LEFT JOIN items i ON i.id = oi.item_id WHERE oi.item_id IS NOT NULL AND i.id IS NULL'
    );
    const [[{ orphanChallans }]] = await pool.query(
      'SELECT COUNT(*) AS orphanChallans FROM supply_challans sc LEFT JOIN orders o ON o.id = sc.order_id WHERE sc.order_id IS NOT NULL AND o.id IS NULL'
    );
    const [[{ rejectedDispatches }]] = await pool.query(
      "SELECT COUNT(*) AS rejectedDispatches FROM orders WHERE order_status = 'REJECTED' AND trackingNo IS NOT NULL"
    );

    assert.strictEqual(Number(invalidOrders), 0);
    assert.strictEqual(Number(orphanLines), 0);
    assert.strictEqual(Number(orphanItems), 0);
    assert.strictEqual(Number(orphanChallans), 0);
    assert.strictEqual(Number(rejectedDispatches), 0);
  });
});
