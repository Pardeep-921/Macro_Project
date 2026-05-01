require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { initDb } = require('./db/init');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env file');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 10 failed login attempts per hour
  message: { success: false, message: 'Too many login attempts, please try again in an hour.' }
});


// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // expects "Bearer <token>"
  if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

const validateRegistration = (req, res, next) => {
  const { email, password, fullname } = req.body;
  if (!email || !password || !fullname) {
    return res.status(400).json({ success: false, message: 'All fields (email, password, fullname) are required.' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Invalid email format.' });
  }
  next();
};

const validateCompany = (req, res, next) => {
  const { companyId, name, email, contact } = req.body || {};
  if (!companyId || !name || !email || !contact) {
    return res.status(400).json({ success: false, message: 'All company fields (companyId, name, email, contact) are required.' });
  }
  next();
};

const validateOrder = (req, res, next) => {
  const { customer, amount, items } = req.body || {};
  if (!customer || !amount) {
    return res.status(400).json({ success: false, message: 'Customer and Amount are required' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
  }
  next();
};

const validateLead = (req, res, next) => {
  const { name } = req.body || {};
  if (!name) {
    return res.status(400).json({ success: false, message: 'Lead name is required.' });
  }
  next();
};

const validateDeal = (req, res, next) => {
  const { name, leadId } = req.body || {};
  if (!name || !leadId) {
    return res.status(400).json({ success: false, message: 'Deal name and Lead ID are required.' });
  }
  next();
};


// --- MYSQL CONNECTION ---
let pool;
const dbReady = initDb()
  .then((p) => {
    pool = p;
    console.log('✅ Connected to MySQL');
    return p;
  })
  .catch((err) => {
    console.error('❌ Failed to connect/init MySQL:', err);
    throw err;
  });

// CHANGED: also fetch status for approval-based access control
async function getUserByEmailOrUsername(identifier) {
  const [rows] = await pool.execute(
    'SELECT id, username, fullname, email, password_hash AS passwordHash, role, status FROM users WHERE username=? OR email=? LIMIT 1',
    [identifier, identifier]
  );
  return rows[0] || null;
}

async function getUserByUsername(username) {
  const [rows] = await pool.execute(
    'SELECT id, username, fullname, email, password_hash AS passwordHash, role, status FROM users WHERE username=? LIMIT 1',
    [username]
  );
  return rows[0] || null;
}

function mapOrderRow(r) {
  return {
    orderNo: r.orderNo,
    customer: r.customer,
    requisition: r.requisition,
    poDate: r.poDate,
    destination: r.destination,
    amount: r.amount,
    status: r.status,
    acceptDate: r.acceptDate,
    pdf: r.pdf,
    paymentStatus: r.paymentStatus || 'Unpaid',
    trackingNo: r.trackingNo || null
  };
}

function mapCompanyRow(r) {
  return {
    companyId: r.companyId,
    name: r.name,
    email: r.email,
    contact: r.contact,
    isActive: Boolean(r.isActive),
  };
}

function mapPrimaryItemRow(r) {
  return {
    id: r.id,
    name: r.name,
    desc: r.item_desc,
  };
}

function mapProductRow(r) {
  return {
    id: r.id,
    itemCode: r.itemCode,
    name: r.name,
    category: r.categoryName,
    categoryId: r.category_id,
    description: r.description,
    uom: r.uom,
    rate: r.rate,
    mrp: r.mrp,
    imageUrl: r.image_url,
    supplierName: r.supplier_name,
    location: r.location,
    experienceYears: r.experience_years,
    phone: r.phone,
    stock: r.stock || 0
  };
}

// --- API ROUTES ---

// AUTHENITCAITON
// CHANGED: added status check — pending/rejected users are blocked from login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || '').trim();
    console.log(`[Login Attempt] Identifier: ${identifier}`);
    
    const user = await getUserByEmailOrUsername(identifier);

    if (!user) {
      console.log(`[Login Failed] User not found for: ${identifier}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log(`[Login Failed] Password mismatch for: ${identifier}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // NEW: approval gate — check account status before issuing token
    console.log(`[Login Check] User status: ${user.status} for: ${identifier}`);
    if (user.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Your registration is pending admin approval.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ success: false, message: 'Your registration request was rejected. Please contact admin.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    console.log(`[Login Success] ${identifier} logged in as ${user.role}`);
    res.json({ success: true, role: user.role, username: user.username, token });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Server error during login: ' + err.message });
  }
});

// REGISTER — CHANGED: customers register as 'pending'; admins register as 'approved'
app.post('/api/auth/register', authLimiter, validateRegistration, async (req, res) => {
  try {
    const { fullname, email, password, role, adminCredential } = req.body;
    const userEmail = (email || '').trim();
    const userPassword = (password || '').trim();

    // Forced role and status for public registration
    const userRole = 'customer';
    const userStatus = 'pending';

    // Check if user already exists (use trimmed email, check both username and email columns)
    const existingUser = await getUserByEmailOrUsername(userEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(userPassword, 10);
    await pool.execute(
      'INSERT INTO users (username, fullname, email, password_hash, role, status) VALUES (?,?,?,?,?,?)',
      [userEmail, fullname || null, userEmail, hashedPassword, userRole, userStatus]
    );

    // Send email notification to Admin
    if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.ADMIN_EMAIL) {
      try {
        await transporter.sendMail({
          from: `"${fullname}" <${process.env.SMTP_USER}>`,
          replyTo: userEmail,
          to: process.env.ADMIN_EMAIL,
          subject: `New User Registration - ${fullname}`,
          text: `A new user has registered and is pending approval.\n\nName: ${fullname}\nEmail: ${userEmail}\n\nPlease login to the admin panel to approve or reject this request.`,
          html: `<p>A new user has registered and is pending approval.</p>
                 <ul>
                   <li><b>Name:</b> ${fullname}</li>
                   <li><b>Email:</b> ${userEmail}</li>
                 </ul>
                 <p>Please login to the admin panel to approve or reject this request.</p>`
        });
        console.log(`[Email] Notification sent to admin for user: ${userEmail}`);
      } catch (emailErr) {
        console.error('[Email Error] Failed to send registration email:', emailErr);
      }
    } else {
      console.log('[Email] Notification not sent. SMTP credentials or ADMIN_EMAIL not configured.');
    }

    const message = 'Registration submitted successfully. Please wait for admin approval.';

    res.json({ success: true, message, user: { fullname, email, role: userRole, status: userStatus } });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// NEW: GET /api/admin/pending-users — fetch all non-admin users with any status
app.get('/api/admin/pending-users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only access.' });
    }
    const [rows] = await pool.execute(
      'SELECT id, username, fullname, email, role, status, createdAt FROM users WHERE role = ? ORDER BY createdAt DESC',
      ['customer']
    );
    res.json({ success: true, users: rows });
  } catch (err) {
    console.error('Pending users fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch pending users' });
  }
});

// NEW: PATCH /api/admin/approve-user/:id — approve a customer
app.patch('/api/admin/approve-user/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only access.' });
    }
    const { id } = req.params;
    const [result] = await pool.execute(
      'UPDATE users SET status = ? WHERE id = ? AND role = ?',
      ['approved', id, 'customer']
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found or already an admin.' });
    }
    res.json({ success: true, message: 'User approved successfully.' });
  } catch (err) {
    console.error('Approve user error:', err);
    res.status(500).json({ success: false, message: 'Failed to approve user' });
  }
});

// NEW: PATCH /api/admin/reject-user/:id — reject a customer
app.patch('/api/admin/reject-user/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only access.' });
    }
    const { id } = req.params;
    const [result] = await pool.execute(
      'UPDATE users SET status = ? WHERE id = ? AND role = ?',
      ['rejected', id, 'customer']
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found or already an admin.' });
    }
    res.json({ success: true, message: 'User rejected successfully.' });
  } catch (err) {
    console.error('Reject user error:', err);
    res.status(500).json({ success: false, message: 'Failed to reject user' });
  }
});

// CREATE ORDER
app.post('/api/orders', authenticateToken, validateOrder, async (req, res) => {
  let connection;
  try {
    const { customer, requisition, destination, amount, items } = req.body;

    const orderNo = 'M' + Math.floor(10000 + Math.random() * 90000);
    const poDate = new Date().toISOString().split('T')[0];

    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      'INSERT INTO orders (orderNo, userId, customer, requisition, poDate, destination, amount, status) VALUES (?,?,?,?,?,?,?,?)',
      [orderNo, req.user.id, customer, requisition || null, poDate, destination || null, amount.toString(), 'Pending']
    );

    for (const item of items) {
      await connection.execute(
        'INSERT INTO order_items (orderNo, productId, itemName, size, quantity, price, uom) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderNo, item.id || null, item.name || 'Unknown', item.size || null, item.qty || 1, item.price?.toString() || '0', item.uom || null]
      );
    }

    await connection.commit();
    connection.release();

    res.status(201).json({ success: true, orderNo, message: 'Order placed successfully' });
  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Order Creation Error:', err);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// ORDERS
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const [rows] = await pool.query(
      'SELECT orderNo, customer, requisition, poDate, destination, amount, status, acceptDate, pdf, paymentStatus, trackingNo FROM orders ORDER BY orderNo ASC LIMIT ? OFFSET ?',
      [limit, skip]
    );
    res.json(rows.map(mapOrderRow));
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// ORDER DETAILS
app.get('/api/orders/:orderNo', authenticateToken, async (req, res) => {
  try {
    const { orderNo } = req.params;
    const [orders] = await pool.execute('SELECT * FROM orders WHERE orderNo = ?', [orderNo]);

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [items] = await pool.execute('SELECT * FROM order_items WHERE orderNo = ?', [orderNo]);

    res.json({
      success: true,
      order: mapOrderRow(orders[0]),
      items: items
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order details' });
  }
});


app.post('/api/orders/:orderNo/approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only access.' });
    const { orderNo } = req.params;
    const acceptDate = new Date().toISOString().split('T')[0];
    const [result] = await pool.execute(
      'UPDATE orders SET status=?, acceptDate=? WHERE orderNo=?',
      ['Accepted', acceptDate, orderNo]
    );
    if (result.affectedRows > 0) {
      const [rows] = await pool.execute(
        'SELECT orderNo, customer, requisition, poDate, destination, amount, status, acceptDate, pdf, paymentStatus, trackingNo FROM orders WHERE orderNo=? LIMIT 1',
        [orderNo]
      );
      res.json({ success: true, order: mapOrderRow(rows[0]) });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to approve order' });
  }
});

app.post('/api/orders/:orderNo/reject', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only access.' });
    const { orderNo } = req.params;
    const acceptDate = new Date().toISOString().split('T')[0];
    const [result] = await pool.execute(
      'UPDATE orders SET status=?, acceptDate=? WHERE orderNo=?',
      ['Rejected', acceptDate, orderNo]
    );
    if (result.affectedRows > 0) {
      const [rows] = await pool.execute(
        'SELECT orderNo, customer, requisition, poDate, destination, amount, status, acceptDate, pdf, paymentStatus, trackingNo FROM orders WHERE orderNo=? LIMIT 1',
        [orderNo]
      );
      res.json({ success: true, order: mapOrderRow(rows[0]) });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reject order' });
  }
});

// UPDATE ORDER (New for Admin)
app.put('/api/orders/:orderNo', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { orderNo } = req.params;
    const { status, paymentStatus, trackingNo } = req.body;

    await pool.execute(
      'UPDATE orders SET status=?, paymentStatus=?, trackingNo=? WHERE orderNo=?',
      [status || 'Pending', paymentStatus || 'Unpaid', trackingNo || null, orderNo]
    );

    res.json({ success: true, message: 'Order updated successfully' });
  } catch (err) {
    console.error('Update Order Error:', err);
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
});

// COMPANIES
app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT companyId, name, email, contact, isActive FROM companies'
    );
    res.json(rows.map(mapCompanyRow));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch companies' });
  }
});

app.post('/api/companies', authenticateToken, validateCompany, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only access.' });
    const { companyId, name, email, contact, isActive } = req.body;
    await pool.execute(
      'INSERT INTO companies (companyId, name, email, contact, isActive) VALUES (?,?,?,?,?)',
      [
        companyId,
        name,
        email,
        contact,
        isActive === false ? 0 : 1,
      ]
    );
    res.json({
      success: true,
      company: { companyId, name, email, contact, isActive: isActive !== false },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save company' });
  }
});

// PRIMARY ITEMS
app.get('/api/primary-items', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, item_desc as `desc` FROM primary_items ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch primary items' });
  }
});

app.post('/api/primary-items', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only access.' });
    const { id, name, desc } = req.body || {};
    await pool.execute(
      'INSERT INTO primary_items (id, name, item_desc) VALUES (?,?,?)',
      [id, name, desc || null]
    );
    res.json({ success: true, item: { id, name, desc } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save' });
  }
});

app.delete('/api/primary-items/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only access.' });
    await pool.execute('DELETE FROM primary_items WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});
// PRODUCTS
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT p.*, c.name as categoryName FROM products p LEFT JOIN product_categories c ON p.category_id = c.id'
    );
    res.json(rows.map(mapProductRow));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { itemCode, name, categoryId, description, uom, rate, mrp, imageUrl, supplierName, location, experienceYears, phone, stock } = req.body;
    await pool.execute(
      'INSERT INTO products (itemCode, name, category_id, description, uom, rate, mrp, image_url, supplier_name, location, experience_years, phone, stock) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [itemCode || null, name, categoryId, description || null, uom || 'PCS', rate || 0, mrp || 0, imageUrl || null, supplierName || null, location || null, experienceYears || 0, phone || null, stock || 0]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save product: ' + err.message });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    await pool.execute('DELETE FROM products WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// CATEGORIES
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM product_categories ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { name } = req.body;
    await pool.execute('INSERT INTO product_categories (name) VALUES (?)', [name]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    await pool.execute('DELETE FROM product_categories WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

// UNITS
app.get('/api/units', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM item_units ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch units' });
  }
});

app.post('/api/units', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { name } = req.body;
    await pool.execute('INSERT INTO item_units (name) VALUES (?)', [name]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save' });
  }
});

app.delete('/api/units/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    await pool.execute('DELETE FROM item_units WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

// SIZES
app.get('/api/sizes', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM item_sizes ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sizes' });
  }
});

app.post('/api/sizes', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { name } = req.body;
    await pool.execute('INSERT INTO item_sizes (name) VALUES (?)', [name]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save' });
  }
});

app.delete('/api/sizes/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    await pool.execute('DELETE FROM item_sizes WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

// LEADS
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM leads';
    let params = [];

    // Horizontal RBAC: Customers only see their own leads, Admins see all
    if (req.user.role !== 'admin') {
      query += ' WHERE userId = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY createdAt DESC';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch leads' });
  }
});

app.post('/api/leads', authenticateToken, validateLead, async (req, res) => {
  try {
    const { name, email, phone, status, companyId } = req.body;

    await pool.execute(
      'INSERT INTO leads (name, email, phone, status, companyId, userId) VALUES (?,?,?,?,?,?)',
      [name, email || null, phone || null, status || 'New', companyId || null, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Lead created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create lead' });
  }
});

app.post('/api/leads/:id/convert', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { dealName, amount } = req.body;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Check if lead exists and belongs to user
    const [leads] = await connection.execute('SELECT * FROM leads WHERE id = ?', [id]);
    if (leads.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (req.user.role !== 'admin' && leads[0].userId !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // 2. Update lead status to Converted
    await connection.execute('UPDATE leads SET status = ? WHERE id = ?', ['Converted', id]);

    // 3. Create a Deal automatically
    await connection.execute(
      'INSERT INTO deals (name, amount, stage, leadId, userId) VALUES (?,?,?,?,?)',
      [dealName || `Deal for ${leads[0].name}`, amount || 0, 'Discovery', id, req.user.id]
    );

    await connection.commit();
    connection.release();
    res.json({ success: true, message: 'Lead converted to deal successfully' });
  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res.status(500).json({ success: false, message: 'Failed to convert lead' });
  }
});

// DEALS
app.get('/api/deals', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM deals';
    let params = [];

    if (req.user.role !== 'admin') {
      query += ' WHERE userId = ?';
      params.push(req.user.id);
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch deals' });
  }
});

app.post('/api/deals', authenticateToken, validateDeal, async (req, res) => {
  try {
    const { name, amount, stage, leadId } = req.body;

    await pool.execute(
      'INSERT INTO deals (name, amount, stage, leadId, userId) VALUES (?,?,?,?,?)',
      [name, amount || 0, stage || 'Discovery', leadId || null, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Deal created' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create deal' });
  }
});

// TASKS
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE userId=?', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Task title is required' });

    await pool.execute(
      'INSERT INTO tasks (title, description, dueDate, userId) VALUES (?,?,?,?)',
      [title, description || null, dueDate || null, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Task created' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
});

// SUPPLY & CHALLANS
app.get('/api/supplies', authenticateToken, async (req, res) => {
  try {
    const { companyId, fromDate, toDate } = req.query;
    let query = `
      SELECT sc.*, sd.itemName, sd.quantity, sd.uom 
      FROM supply_challans sc
      JOIN supply_details sd ON sc.challanNo = sd.challanNo
    `;
    let params = [];
    let where = [];

    if (req.user.role !== 'admin') {
      // Logic for filtering by company for customers could be added here
    }

    if (companyId) { where.push('sc.companyId = ?'); params.push(companyId); }
    if (fromDate) { where.push('sc.challanDate >= ?'); params.push(fromDate); }
    if (toDate) { where.push('sc.challanDate <= ?'); params.push(toDate); }

    if (where.length > 0) query += ' WHERE ' + where.join(' AND ');

    query += ' ORDER BY sc.challanDate DESC';
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch supplies' });
  }
});

app.post('/api/challans', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { challanNo, companyId, challanDate, items } = req.body;
    await connection.beginTransaction();

    await connection.execute(
      'INSERT INTO supply_challans (challanNo, companyId, challanDate, uploadedBy) VALUES (?,?,?,?)',
      [challanNo, companyId, challanDate, req.user.id]
    );

    for (const item of items) {
      await connection.execute(
        'INSERT INTO supply_details (challanNo, itemName, quantity, uom) VALUES (?,?,?,?)',
        [challanNo, item.itemName, item.quantity, item.uom]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Challan uploaded successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, message: 'Failed to upload challan: ' + err.message });
  } finally {
    connection.release();
  }
});

if (require.main === module) {
  dbReady
    .then(() => {
      // REPORTING
      app.get('/api/reports/sales', authenticateToken, async (req, res) => {
        try {
          if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
          const [rows] = await pool.execute(`
            SELECT 
              DATE_FORMAT(STR_TO_DATE(poDate, '%d-%m-%Y'), '%Y-%m') as month,
              COUNT(*) as orderCount,
              SUM(CAST(amount AS DECIMAL(15,2))) as totalRevenue
            FROM orders
            GROUP BY month
            ORDER BY month ASC
          `);
          res.json(rows);
        } catch (err) {
          console.error('Sales Report Error:', err);
          res.status(500).json({ success: false, message: 'Failed to fetch sales report' });
        }
      });

      app.get('/api/reports/supplies', authenticateToken, async (req, res) => {
        try {
          if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
          const [rows] = await pool.execute(`
            SELECT 
              DATE_FORMAT(challanDate, '%Y-%m') as month,
              COUNT(*) as challanCount
            FROM supply_challans
            WHERE challanDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC
          `);
          res.json(rows);
        } catch (err) {
          console.error('Supply Report Error:', err);
          res.status(500).json({ success: false, message: 'Failed to fetch supply report' });
        }
      });

      app.listen(port, () => {
        console.log(`Backend API running at http://localhost:${port}`);
      });
    })
    .catch(() => process.exit(1));
}

module.exports = app;
module.exports.dbReady = dbReady;
