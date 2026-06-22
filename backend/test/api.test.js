'use strict';

require('dotenv').config();

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { ensureSchema, seedIfEmpty } = require('../db/init');

describe('Express API (MySQL)', () => {
  let app;
  let pool;

  before(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_integration';

    app = require('../server');
    pool = await app.dbReady;

    // Ensure schema exists, then reset tables deterministically
    await ensureSchema(pool);
    await pool.query('SET FOREIGN_KEY_CHECKS=0');
    await pool.query('TRUNCATE TABLE users');
    await pool.query('TRUNCATE TABLE orders');
    await pool.query('TRUNCATE TABLE companies');
    await pool.query('TRUNCATE TABLE primary_items');
    await pool.query('SET FOREIGN_KEY_CHECKS=1');
    await seedIfEmpty(pool);
  });

  after(async () => {
    if (pool) {
      await pool.query('SET FOREIGN_KEY_CHECKS=0');
      await pool.query('TRUNCATE TABLE users');
      await pool.query('TRUNCATE TABLE orders');
      await pool.query('TRUNCATE TABLE companies');
      await pool.query('TRUNCATE TABLE primary_items');
      await pool.query('SET FOREIGN_KEY_CHECKS=1');
      await pool.end();
    }
  });

  it('POST /api/auth/login returns 200 and token for admin/admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin' })
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.role, 'admin');
    assert.strictEqual(res.body.username, 'admin');
    assert.ok(typeof res.body.token === 'string' && res.body.token.length > 0);
  });

  it('POST /api/auth/login returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' })
      .expect(401);

    assert.strictEqual(res.body.success, false);
  });

  it('GET /api/orders without token returns 401', async () => {
    await request(app).get('/api/orders').expect(401);
  });

  it('GET /api/orders with customer token returns 200 and list', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'customer', password: 'customer' });

    const token = login.body.token;
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 1);
    const orderNos = res.body.map((o) => o.orderNo);
    assert.ok(orderNos.includes('M10001'));
  });

  it('POST /api/orders/:orderNo/approve forbids customer (403)', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'customer', password: 'customer' });

    await request(app)
      .post('/api/orders/M10001/approve')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(403);
  });

  it('POST /api/orders/:orderNo/approve allows admin and updates order', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin' });

    const res = await request(app)
      .post('/api/orders/M10001/approve')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.order.status, 'Accepted');
    assert.ok(res.body.order.acceptDate);
  });

  it('POST /api/auth/register creates customer and rejects duplicate email', async () => {
    const email = `e2e_${Date.now()}@example.com`;
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ fullname: 'E2E User', email, password: 'secret123' })
      .expect(200);

    assert.strictEqual(reg.body.success, true);

    const dup = await request(app)
      .post('/api/auth/register')
      .send({ fullname: 'Other', email, password: 'x' })
      .expect(400);

    assert.strictEqual(dup.body.success, false);

    await request(app)
      .post('/api/auth/login')
      .send({ username: email, password: 'secret123' })
      .expect(403);

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin' });

    await request(app)
      .patch(`/api/admin/approve-user/${reg.body.user.id}`)
      .set('Authorization', `Bearer ${adminLogin.body.token}`)
      .expect(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: email, password: 'secret123' })
      .expect(200);

    assert.strictEqual(login.body.role, 'customer');
  });
});
