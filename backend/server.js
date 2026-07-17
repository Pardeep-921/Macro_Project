require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const XLSX = require('xlsx');
const { initDb } = require('./db/init');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env file');
  process.exit(1);
}

const emailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const transporter = emailConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

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
  max: Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again in an hour.' }
});


// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
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
  const companyId = req.body?.companyId || req.body?.company_id_code;
  const name = req.body?.name || req.body?.company_name;
  const { email } = req.body || {};
  if (!companyId || !name || !email) {
    return res.status(400).json({ success: false, message: 'Company ID, company name, and email are required.' });
  }
  next();
};

const validateOrder = (req, res, next) => {
  const { destination, items } = req.body || {};
  const hasDestination = String(destination || '').trim().length > 0;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
  }
  if (!hasDestination) {
    return res.status(400).json({ success: false, message: 'Destination is required.' });
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

function normalizeRole(role) {
  const value = String(role || '').trim().toUpperCase();
  if (value === 'ADMIN') return 'ADMIN';
  if (value === 'CUSTOMER' || value === 'USER') return 'CUSTOMER';
  return value;
}

function toClientRole(role) {
  const normalized = normalizeRole(role);
  if (normalized === 'ADMIN') return 'admin';
  if (normalized === 'CUSTOMER') return 'customer';
  return String(role || '').toLowerCase();
}

function isAdminUser(user) {
  return normalizeRole(user?.role_master || user?.role) === 'ADMIN';
}

function normalizeOrderStatus(status) {
  const value = String(status || '').trim().toUpperCase();
  if (['PENDING', 'ACCEPTED', 'REJECTED', 'DISPATCHED'].includes(value)) return value;
  if (value === 'SHIPPED' || value === 'DELIVERED') return 'DISPATCHED';
  return 'PENDING';
}

function toClientOrderStatus(status) {
  const normalized = normalizeOrderStatus(status);
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

function isApprovedAccount(user) {
  if (user.source === 'companies') return Boolean(user.is_active);
  return user.status !== 'pending' && user.status !== 'rejected';
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

async function sendPortalMail({ to, subject, text, html }) {
  if (!emailConfigured || !transporter || !to) {
    console.log(`[Email] Skipped "${subject}". SMTP or recipient is not configured.`);
    return { skipped: true };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"MACO ERP" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email] Sent "${subject}" to ${to}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Email Error] Failed to send "${subject}":`, err);
    return { error: err.message };
  }
}

async function notifyOrderPlaced(order, company, lines) {
  const lineSummary = lines.map((line) => `${line.itemName} x ${line.quantity}`).join(', ');
  const subject = `New MACO order ${order.orderNo}`;
  const text = `Order ${order.orderNo} was placed by ${company.company_name}.\nAmount: Rs. ${formatMoney(order.netAmount)}\nItems: ${lineSummary}`;
  await Promise.all([
    sendPortalMail({
      to: process.env.ADMIN_EMAIL,
      subject,
      text,
      html: `<p>Order <b>${order.orderNo}</b> was placed by <b>${company.company_name}</b>.</p><p>Amount: Rs. ${formatMoney(order.netAmount)}</p><p>${lineSummary}</p>`,
    }),
    sendPortalMail({
      to: company.email,
      subject: `MACO order received: ${order.orderNo}`,
      text: `Your order ${order.orderNo} has been received and is pending review.\nAmount: Rs. ${formatMoney(order.netAmount)}`,
      html: `<p>Your order <b>${order.orderNo}</b> has been received and is pending review.</p><p>Amount: Rs. ${formatMoney(order.netAmount)}</p>`,
    }),
  ]);
}

async function notifyChallanCreated(challan) {
  const subject = `MACO dispatch update: ${challan.challan_no}`;
  const text = `Challan ${challan.challan_no} has been created for order ${challan.order_no || 'N/A'}.\nCarrier: ${challan.carrier_name || 'N/A'}\nDate: ${challan.challan_date}`;
  await Promise.all([
    sendPortalMail({
      to: process.env.ADMIN_EMAIL,
      subject,
      text,
      html: `<p>Challan <b>${challan.challan_no}</b> has been created.</p><p>Order: ${challan.order_no || 'N/A'}<br/>Carrier: ${challan.carrier_name || 'N/A'}<br/>Date: ${challan.challan_date}</p>`,
    }),
    sendPortalMail({
      to: challan.company_email,
      subject,
      text,
      html: `<p>Your order ${challan.order_no || ''} has a dispatch update.</p><p>Challan: <b>${challan.challan_no}</b><br/>Carrier: ${challan.carrier_name || 'N/A'}<br/>Date: ${challan.challan_date}</p>`,
    }),
  ]);
}

function sendWorkbook(res, rows, sheetName, fileName) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(buffer);
}

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

async function getUserByEmailOrUsername(identifier) {
  const [companyRows] = await pool.execute(
    `SELECT
       id,
       username,
       company_name AS fullname,
       email,
       password_hash AS passwordHash,
       role_master,
       is_active,
       company_id_code,
       'companies' AS source
     FROM companies
     WHERE username = ? OR email = ? OR company_id_code = ?
     LIMIT 1`,
    [identifier, identifier, identifier]
  );

  if (companyRows[0]) return companyRows[0];

  const [rows] = await pool.execute(
    `SELECT
       id,
       username,
       fullname,
       email,
       password_hash AS passwordHash,
       role,
       status,
       NULL AS company_id_code,
       'users' AS source
     FROM users
     WHERE username=? OR email=?
     LIMIT 1`,
    [identifier, identifier]
  );
  return rows[0] || null;
}

async function getUserByUsername(username) {
  const [companyRows] = await pool.execute(
    `SELECT
       id,
       username,
       company_name AS fullname,
       email,
       password_hash AS passwordHash,
       role_master,
       is_active,
       company_id_code,
       'companies' AS source
     FROM companies
     WHERE username=?
     LIMIT 1`,
    [username]
  );

  if (companyRows[0]) return companyRows[0];

  const [rows] = await pool.execute(
    `SELECT
       id,
       username,
       fullname,
       email,
       password_hash AS passwordHash,
       role,
       status,
       NULL AS company_id_code,
       'users' AS source
     FROM users
     WHERE username=?
     LIMIT 1`,
    [username]
  );
  return rows[0] || null;
}

function mapOrderRow(r) {
  const orderStatus = normalizeOrderStatus(r.order_status || r.status);
  const orderNo = r.order_no || r.orderNo;
  const amount = r.net_amount ?? r.amount;
  const reviewDate = r.review_date || r.acceptDate;
  return {
    id: r.id,
    orderNo,
    order_no: orderNo,
    company_id: r.company_id,
    customer: r.customer || r.company_name,
    requisition: r.requisition_no || r.requisition,
    requisition_no: r.requisition_no || r.requisition,
    poDate: r.po_date || r.poDate,
    po_date: r.po_date || r.poDate,
    destination: r.destination,
    amount,
    net_amount: amount,
    status: toClientOrderStatus(orderStatus),
    order_status: orderStatus,
    acceptDate: reviewDate,
    review_date: reviewDate,
    pdf: r.pdf,
    paymentStatus: r.paymentStatus || 'Unpaid',
    trackingNo: r.trackingNo || null
  };
}

function mapCompanyRow(r) {
  return {
    id: r.id,
    companyId: r.company_id_code || r.companyId,
    company_id_code: r.company_id_code || r.companyId,
    name: r.company_name || r.name,
    company_name: r.company_name || r.name,
    username: r.username,
    first_name: r.first_name,
    last_name: r.last_name,
    email: r.email,
    contact: r.contact_no || r.contact,
    contact_no: r.contact_no || r.contact,
    address_1: r.address_1,
    address_2: r.address_2,
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    fax: r.fax,
    ecc_no: r.ecc_no,
    services_tax_no: r.services_tax_no,
    pan_no: r.pan_no,
    registration_no: r.registration_no,
    tin_no: r.tin_no,
    cst_no: r.cst_no,
    role_master: normalizeRole(r.role_master || 'CUSTOMER'),
    isActive: Boolean(r.is_active ?? r.isActive),
    is_active: Boolean(r.is_active ?? r.isActive),
  };
}

function mapPrimaryGroupRow(r) {
  return {
    id: r.id,
    name: r.group_name,
    group_name: r.group_name,
    desc: r.description,
    description: r.description,
    created_at: r.created_at,
  };
}

function mapSubGroupRow(r) {
  return {
    id: r.id,
    name: r.sub_group_name,
    sub_group_name: r.sub_group_name,
    primary_group_id: r.primary_group_id,
    primaryGroupId: r.primary_group_id,
    primaryGroupName: r.primary_group_name,
    primary_group_name: r.primary_group_name,
    chapter_heading_no: r.chapter_heading_no,
    chapterHeadingNo: r.chapter_heading_no,
    created_at: r.created_at,
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
  const itemCode = r.item_code || r.itemCode;
  const name = r.item_name || r.name;
  const categoryName = r.sub_group_name || r.primary_group_name || r.categoryName;
  const uom = r.unit_name || r.uom;
  const rate = r.list_price ?? r.rate;
  return {
    id: r.id,
    itemCode,
    item_code: itemCode,
    name,
    item_name: name,
    category: categoryName,
    categoryId: r.category_id || r.sub_group_id,
    primary_group_id: r.primary_group_id,
    primaryGroupName: r.primary_group_name,
    primary_group_name: r.primary_group_name,
    sub_group_id: r.sub_group_id,
    subGroupName: r.sub_group_name,
    sub_group_name: r.sub_group_name,
    item_size_id: r.item_size_id,
    size: r.size_code,
    size_code: r.size_code,
    unit_id: r.unit_id,
    alternate_unit_id: r.alternate_unit_id,
    alternateUnitName: r.alternate_unit_name,
    alternate_unit_name: r.alternate_unit_name,
    description: r.description,
    uom,
    unitName: uom,
    unit_name: uom,
    rate,
    list_price: rate,
    mrp: r.mrp,
    imageUrl: r.image_url,
    supplierName: r.supplier_name,
    location: r.location,
    experienceYears: r.experience_years,
    phone: r.phone,
    stock: r.stock || 0,
    is_active: Boolean(r.is_active ?? true),
  };
}

function mapUnitRow(r) {
  const name = r.unit_name || r.name;
  return {
    id: r.id,
    name,
    unit_name: name,
    description: r.description || '',
  };
}

function mapSizeRow(r) {
  const name = r.size_code || r.name;
  return {
    id: r.id,
    name,
    size_code: name,
    description: r.description || '',
  };
}

function mapShippingCarrierRow(r) {
  const name = r.method_name || r.name;
  return {
    id: r.id,
    name,
    method_name: name,
    created_at: r.created_at,
  };
}

function mapChallanRow(r) {
  const challanNo = r.challan_no || r.challanNo;
  const challanDate = r.challan_date || r.challanDate;
  const carrierName = r.method_name || r.carrier_name || r.carrierName;
  return {
    id: r.id,
    challanNo,
    challan_no: challanNo,
    orderNo: r.order_no || r.orderNo,
    order_no: r.order_no || r.orderNo,
    companyId: r.company_id_code || r.companyId,
    company_id: r.company_id,
    companyName: r.company_name || r.companyName,
    company_name: r.company_name || r.companyName,
    carrierId: r.carrier_id,
    carrierName,
    carrier_name: carrierName,
    challanDate,
    challan_date: challanDate,
    supplyDetails: r.supply_details || r.supplyDetails,
    supply_details: r.supply_details || r.supplyDetails,
    created_at: r.created_at || r.createdAt,
  };
}

async function getItemMasterRows(search = '', activeOnly = false) {
  const params = [];
  const filters = [];
  if (activeOnly) filters.push('i.is_active = 1');
  if (search) {
    filters.push(`(
      i.item_code LIKE ? OR i.item_name LIKE ? OR
      pg.group_name LIKE ? OR sg.sub_group_name LIKE ?
    )`);
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT
       i.*,
       pg.group_name AS primary_group_name,
       sg.sub_group_name,
       sz.size_code,
       u.unit_name,
       au.unit_name AS alternate_unit_name
     FROM items i
     JOIN primary_groups pg ON pg.id = i.primary_group_id
     JOIN sub_groups sg ON sg.id = i.sub_group_id
     JOIN item_sizes sz ON sz.id = i.item_size_id
     JOIN item_units u ON u.id = i.unit_id
     LEFT JOIN item_units au ON au.id = i.alternate_unit_id
     ${where}
     ORDER BY i.item_code, i.item_name`,
    params
  );
  return rows;
}

async function getCompanyForRequest(user, connection = pool) {
  if (user?.source === 'companies') {
    const [rows] = await connection.execute(
      'SELECT id, company_id_code, company_name, username, email FROM companies WHERE id = ? AND is_active = 1 LIMIT 1',
      [user.id]
    );
    return rows[0] || null;
  }

  const [rows] = await connection.execute(
    `SELECT id, company_id_code, company_name, username, email
     FROM companies
     WHERE username = ? OR company_id_code = ?
     ORDER BY id
     LIMIT 1`,
    [user?.username || '', user?.company_id_code || '']
  );
  return rows[0] || null;
}

async function generateOrderNo(connection) {
  const prefix = `M${new Date().getFullYear()}`;
  const [rows] = await connection.execute(
    "SELECT order_no FROM orders WHERE order_no LIKE ? ORDER BY id DESC LIMIT 1",
    [`${prefix}%`]
  );
  const lastNumber = rows[0]?.order_no
    ? Number.parseInt(String(rows[0].order_no).replace(prefix, ''), 10)
    : 0;
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

async function getOrderByNo(orderNo, connection = pool) {
  const [rows] = await connection.execute(
    `SELECT
       o.*,
       COALESCE(c.company_name, o.customer) AS company_name
     FROM orders o
     LEFT JOIN companies c ON c.id = o.company_id
     WHERE o.order_no = ? OR o.orderNo = ?
     LIMIT 1`,
    [orderNo, orderNo]
  );
  return rows[0] || null;
}

async function assertCustomerCanAccessOrder(req, order) {
  if (isAdminUser(req.user)) return true;
  const company = await getCompanyForRequest(req.user);
  return Boolean(company && Number(order.company_id) === Number(company.id));
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
    console.log(`[Login Check] Account status: ${user.status || (user.is_active ? 'active' : 'inactive')} for: ${identifier}`);
    if (user.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Your registration is pending admin approval.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ success: false, message: 'Your registration request was rejected. Please contact admin.' });
    }
    if (!isApprovedAccount(user)) {
      return res.status(403).json({ success: false, message: 'Your account is inactive. Please contact admin.' });
    }

    const roleMaster = normalizeRole(user.role_master || user.role);
    const role = toClientRole(roleMaster);
    const token = jwt.sign(
      {
        id: user.id,
        role,
        role_master: roleMaster,
        username: user.username,
        company_id_code: user.company_id_code || null,
        source: user.source,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    console.log(`[Login Success] ${identifier} logged in as ${roleMaster}`);
    res.json({
      success: true,
      role,
      role_master: roleMaster,
      username: user.username,
      company_id_code: user.company_id_code || null,
      token,
    });
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
    const [insertResult] = await pool.execute(
      'INSERT INTO users (username, fullname, email, password_hash, role, status) VALUES (?,?,?,?,?,?)',
      [userEmail, fullname || null, userEmail, hashedPassword, userRole, userStatus]
    );

    // Send email notification to Admin
    await sendPortalMail({
      to: process.env.ADMIN_EMAIL,
      subject: `New User Registration - ${fullname}`,
      text: `A new user has registered and is pending approval.\n\nName: ${fullname}\nEmail: ${userEmail}\n\nPlease login to the admin panel to approve or reject this request.`,
      html: `<p>A new user has registered and is pending approval.</p>
             <ul>
               <li><b>Name:</b> ${fullname}</li>
               <li><b>Email:</b> ${userEmail}</li>
             </ul>
             <p>Please login to the admin panel to approve or reject this request.</p>`,
    });

    const message = 'Registration submitted successfully. Please wait for admin approval.';

    res.json({
      success: true,
      message,
      user: { id: insertResult.insertId, fullname, email, role: userRole, status: userStatus }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// NEW: GET /api/admin/pending-users — fetch all non-admin users with any status
app.get('/api/admin/pending-users', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
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
    if (!isAdminUser(req.user)) {
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
    if (!isAdminUser(req.user)) {
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
    if (isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Customer account required to place orders.' });
    }

    const { requisition, requisition_no, po_date, destination, items } = req.body;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const company = await getCompanyForRequest(req.user, connection);
    if (!company) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'No active company profile is linked to this login.' });
    }

    const normalizedLines = [];
    for (const item of items) {
      const itemId = Number(item.item_id || item.id);
      const quantity = Number.parseInt(item.quantity || item.qty, 10);
      if (!Number.isInteger(itemId) || itemId <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Each order item needs a valid item and quantity.' });
      }

      const [itemRows] = await connection.execute(
        `SELECT
           i.id,
           i.item_name,
           i.item_size_id,
           i.list_price,
           u.unit_name,
           sz.size_code
         FROM items i
         JOIN item_units u ON u.id = i.unit_id
         JOIN item_sizes sz ON sz.id = i.item_size_id
         WHERE i.id = ? AND i.is_active = 1
         LIMIT 1`,
        [itemId]
      );
      const dbItem = itemRows[0];
      if (!dbItem) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: `Item ${itemId} is not available in the active catalog.` });
      }

      const sizeId = Number(item.size_id || item.item_size_id || dbItem.item_size_id);
      const unitPrice = Number(dbItem.list_price || item.unit_price || item.price || 0);
      normalizedLines.push({
        itemId: dbItem.id,
        itemName: dbItem.item_name,
        sizeId,
        sizeCode: item.size || dbItem.size_code,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        uom: dbItem.unit_name,
      });
    }

    const orderNo = await generateOrderNo(connection);
    const poDate = po_date || new Date().toISOString().split('T')[0];
    const requisitionNo = requisition_no || requisition || null;
    const netAmount = normalizedLines.reduce((sum, line) => sum + line.totalPrice, 0);

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (
        orderNo, order_no, userId, company_id, customer, requisition, requisition_no,
        poDate, po_date, destination, amount, net_amount, status, order_status, pdf
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        orderNo,
        orderNo,
        req.user.source === 'users' ? req.user.id : null,
        company.id,
        company.company_name || company.username || req.user.username,
        requisitionNo,
        requisitionNo,
        poDate,
        poDate,
        destination,
        netAmount.toFixed(2),
        netAmount,
        'Pending',
        'PENDING',
        'PDF',
      ]
    );
    const orderId = orderResult.insertId;

    for (const line of normalizedLines) {
      await connection.execute(
        `INSERT INTO order_items (
          orderNo, order_id, productId, item_id, itemName, size_id, size,
          quantity, price, unit_price, total_price, uom
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNo,
          orderId,
          null,
          line.itemId,
          line.itemName,
          line.sizeId,
          line.sizeCode,
          line.quantity,
          line.unitPrice.toFixed(2),
          line.unitPrice,
          line.totalPrice,
          line.uom,
        ]
      );
    }

    await connection.commit();
    connection.release();

    await notifyOrderPlaced({ orderNo, netAmount }, company, normalizedLines);

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
    const params = [];
    let where = '';
    if (!isAdminUser(req.user)) {
      const company = await getCompanyForRequest(req.user);
      if (!company) return res.json([]);
      where = 'WHERE o.company_id = ?';
      params.push(company.id);
    }
    params.push(limit, skip);
    const [rows] = await pool.query(
      `SELECT
         o.*,
         COALESCE(c.company_name, o.customer) AS company_name
       FROM orders o
       LEFT JOIN companies c ON c.id = o.company_id
       ${where}
       ORDER BY o.created_at DESC, o.id DESC
       LIMIT ? OFFSET ?`,
      params
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
    const order = await getOrderByNo(orderNo);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (!(await assertCustomerCanAccessOrder(req, order))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const [items] = await pool.execute(
      `SELECT
         oi.*,
         i.item_code,
         i.item_name,
         sz.size_code,
         u.unit_name
       FROM order_items oi
       LEFT JOIN items i ON i.id = oi.item_id
       LEFT JOIN item_sizes sz ON sz.id = oi.size_id
       LEFT JOIN item_units u ON u.unit_name = oi.uom
       WHERE oi.order_id = ? OR oi.orderNo = ?
       ORDER BY oi.id`,
      [order.id, order.order_no || order.orderNo]
    );

    res.json({
      success: true,
      order: mapOrderRow(order),
      items: items.map((item) => ({
        ...item,
        itemName: item.item_name || item.itemName,
        size: item.size_code || item.size,
        price: item.unit_price ?? item.price,
        total: item.total_price,
        uom: item.unit_name || item.uom,
      }))
    });
  } catch (err) {
    console.error('Order detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order details' });
  }
});

app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const [rows] = await pool.execute(`
      SELECT order_status, COUNT(*) AS count, COALESCE(SUM(net_amount), 0) AS total
      FROM orders
      GROUP BY order_status
    `);
    const stats = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      dispatched: 0,
      revenue: 0,
    };
    for (const row of rows) {
      const key = normalizeOrderStatus(row.order_status).toLowerCase();
      stats[key] = Number(row.count) || 0;
      if (key === 'accepted' || key === 'dispatched') stats.revenue += Number(row.total) || 0;
    }
    res.json({ success: true, stats });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

app.patch('/api/orders/:orderNo/status', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const { orderNo } = req.params;
    const nextStatus = normalizeOrderStatus(req.body?.status);
    const order = await getOrderByNo(orderNo);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const currentStatus = normalizeOrderStatus(order.order_status || order.status);
    if (!['ACCEPTED', 'REJECTED'].includes(nextStatus)) {
      return res.status(400).json({ success: false, message: 'Status must be ACCEPTED or REJECTED for order review.' });
    }
    if (currentStatus !== 'PENDING') {
      return res.status(409).json({ success: false, message: 'Only pending orders can be reviewed.' });
    }

    await pool.execute(
      "UPDATE orders SET status=?, order_status=?, acceptDate=CURDATE(), review_date=NOW() WHERE id=?",
      [toClientOrderStatus(nextStatus), nextStatus, order.id]
    );
    const updated = await getOrderByNo(orderNo);
    res.json({ success: true, order: mapOrderRow(updated) });
  } catch (err) {
    console.error('Order status update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

app.post('/api/orders/:orderNo/approve', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const { orderNo } = req.params;
    const order = await getOrderByNo(orderNo);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (normalizeOrderStatus(order.order_status || order.status) !== 'PENDING') {
      return res.status(409).json({ success: false, message: 'Only pending orders can be approved.' });
    }
    const [result] = await pool.execute(
      "UPDATE orders SET status=?, order_status=?, acceptDate=CURDATE(), review_date=NOW() WHERE id=?",
      ['Accepted', 'ACCEPTED', order.id]
    );
    if (result.affectedRows > 0) {
      const updated = await getOrderByNo(orderNo);
      res.json({ success: true, order: mapOrderRow(updated) });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to approve order' });
  }
});

app.post('/api/orders/:orderNo/reject', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const { orderNo } = req.params;
    const order = await getOrderByNo(orderNo);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (normalizeOrderStatus(order.order_status || order.status) !== 'PENDING') {
      return res.status(409).json({ success: false, message: 'Only pending orders can be rejected.' });
    }
    const [result] = await pool.execute(
      "UPDATE orders SET status=?, order_status=?, acceptDate=CURDATE(), review_date=NOW() WHERE id=?",
      ['Rejected', 'REJECTED', order.id]
    );
    if (result.affectedRows > 0) {
      const updated = await getOrderByNo(orderNo);
      res.json({ success: true, order: mapOrderRow(updated) });
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
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    const { orderNo } = req.params;
    const { status, paymentStatus, trackingNo } = req.body;
    const order = await getOrderByNo(orderNo);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const nextStatus = normalizeOrderStatus(status || order.order_status || order.status);
    const currentStatus = normalizeOrderStatus(order.order_status || order.status);
    if (currentStatus === 'REJECTED' && nextStatus === 'DISPATCHED') {
      return res.status(409).json({ success: false, message: 'Rejected orders cannot be dispatched.' });
    }
    if (nextStatus === 'DISPATCHED' && currentStatus !== 'ACCEPTED' && currentStatus !== 'DISPATCHED') {
      return res.status(409).json({ success: false, message: 'Only accepted orders can be dispatched.' });
    }

    const clientStatus = toClientOrderStatus(nextStatus);
    await pool.execute(
      `UPDATE orders
       SET status=?, order_status=?, paymentStatus=?, trackingNo=?,
           review_date = CASE WHEN order_status <> ? THEN NOW() ELSE review_date END
       WHERE id=?`,
      [clientStatus, nextStatus, paymentStatus || 'Unpaid', trackingNo || null, nextStatus, order.id]
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
    const search = String(req.query.search || '').trim();
    const params = [];
    let where = '';
    if (search) {
      where = `
        WHERE company_id_code LIKE ?
           OR company_name LIKE ?
           OR username LIKE ?
           OR email LIKE ?
           OR contact_no LIKE ?
           OR city LIKE ?
           OR state LIKE ?
           OR pan_no LIKE ?
           OR tin_no LIKE ?
      `;
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like, like, like, like);
    }

    const [rows] = await pool.execute(
      `SELECT * FROM companies ${where} ORDER BY company_name ASC, name ASC, id ASC`,
      params
    );
    res.json(rows.map(mapCompanyRow));
  } catch (err) {
    console.error('Company fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch companies' });
  }
});

app.post('/api/companies', authenticateToken, validateCompany, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const companyId = String(req.body.companyId || req.body.company_id_code || '').trim();
    const companyName = String(req.body.name || req.body.company_name || '').trim();
    const username = String(req.body.username || companyId).trim();
    const passwordHash = req.body.password ? await bcrypt.hash(String(req.body.password), 10) : null;

    const [result] = await pool.execute(
      `INSERT INTO companies (
        companyId, name, company_id_code, company_name, username, password_hash,
        first_name, last_name, email, contact, contact_no, address_1, address_2,
        city, state, pincode, fax, ecc_no, services_tax_no, pan_no,
        registration_no, tin_no, cst_no, role_master, isActive, is_active
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        companyId,
        companyName,
        companyId,
        companyName,
        username || null,
        passwordHash,
        req.body.first_name || null,
        req.body.last_name || null,
        req.body.email,
        req.body.contact || req.body.contact_no || null,
        req.body.contact_no || req.body.contact || null,
        req.body.address_1 || null,
        req.body.address_2 || null,
        req.body.city || null,
        req.body.state || null,
        req.body.pincode || null,
        req.body.fax || null,
        req.body.ecc_no || null,
        req.body.services_tax_no || null,
        req.body.pan_no || null,
        req.body.registration_no || null,
        req.body.tin_no || null,
        req.body.cst_no || null,
        normalizeRole(req.body.role_master || 'CUSTOMER'),
        req.body.isActive === false || req.body.is_active === false ? 0 : 1,
        req.body.isActive === false || req.body.is_active === false ? 0 : 1,
      ]
    );
    const [[company]] = await pool.execute('SELECT * FROM companies WHERE id = ?', [result.insertId]);
    res.json({
      success: true,
      company: mapCompanyRow(company),
    });
  } catch (err) {
    console.error('Company save error:', err);
    const duplicate = err.code === 'ER_DUP_ENTRY';
    res.status(duplicate ? 409 : 500).json({ success: false, message: duplicate ? 'Company ID or username already exists.' : 'Failed to save company' });
  }
});

app.put('/api/companies/:id', authenticateToken, validateCompany, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const companyId = String(req.body.companyId || req.body.company_id_code || '').trim();
    const companyName = String(req.body.name || req.body.company_name || '').trim();
    const username = String(req.body.username || companyId).trim();
    const active = req.body.isActive === false || req.body.is_active === false ? 0 : 1;
    const params = [
      companyId,
      companyName,
      companyId,
      companyName,
      username || null,
      req.body.first_name || null,
      req.body.last_name || null,
      req.body.email,
      req.body.contact || req.body.contact_no || null,
      req.body.contact_no || req.body.contact || null,
      req.body.address_1 || null,
      req.body.address_2 || null,
      req.body.city || null,
      req.body.state || null,
      req.body.pincode || null,
      req.body.fax || null,
      req.body.ecc_no || null,
      req.body.services_tax_no || null,
      req.body.pan_no || null,
      req.body.registration_no || null,
      req.body.tin_no || null,
      req.body.cst_no || null,
      normalizeRole(req.body.role_master || 'CUSTOMER'),
      active,
      active,
    ];
    let passwordSql = '';
    if (req.body.password) {
      passwordSql = ', password_hash=?';
      params.push(await bcrypt.hash(String(req.body.password), 10));
    }
    params.push(req.params.id);

    const [result] = await pool.execute(
      `UPDATE companies SET
        companyId=?, name=?, company_id_code=?, company_name=?, username=?,
        first_name=?, last_name=?, email=?, contact=?, contact_no=?,
        address_1=?, address_2=?, city=?, state=?, pincode=?, fax=?,
        ecc_no=?, services_tax_no=?, pan_no=?, registration_no=?, tin_no=?,
        cst_no=?, role_master=?, isActive=?, is_active=?${passwordSql}
      WHERE id=?`,
      params
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Company not found.' });
    const [[company]] = await pool.execute('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    res.json({ success: true, company: mapCompanyRow(company) });
  } catch (err) {
    console.error('Company update error:', err);
    const duplicate = err.code === 'ER_DUP_ENTRY';
    res.status(duplicate ? 409 : 500).json({ success: false, message: duplicate ? 'Company ID or username already exists.' : 'Failed to update company' });
  }
});

app.delete('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const [result] = await pool.execute('DELETE FROM companies WHERE id=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Company not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Company delete error:', err);
    const conflict = err.code === 'ER_ROW_IS_REFERENCED_2';
    res.status(conflict ? 409 : 500).json({ success: false, message: conflict ? 'Company is linked to existing records and cannot be deleted.' : 'Failed to delete company' });
  }
});

// PRIMARY GROUPS
app.get('/api/primary-groups', authenticateToken, async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const params = [];
    let where = '';
    if (search) {
      where = 'WHERE group_name LIKE ? OR description LIKE ?';
      const like = `%${search}%`;
      params.push(like, like);
    }
    const [rows] = await pool.execute(`SELECT * FROM primary_groups ${where} ORDER BY group_name`, params);
    res.json(rows.map(mapPrimaryGroupRow));
  } catch (err) {
    console.error('Primary group fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch primary groups' });
  }
});

app.post('/api/primary-groups', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const name = String(req.body.name || req.body.group_name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Primary group name is required.' });
    const [result] = await pool.execute('INSERT INTO primary_groups (group_name, description) VALUES (?,?)', [name, req.body.desc || req.body.description || null]);
    const [[row]] = await pool.execute('SELECT * FROM primary_groups WHERE id=?', [result.insertId]);
    res.json({ success: true, item: mapPrimaryGroupRow(row) });
  } catch (err) {
    console.error('Primary group save error:', err);
    const duplicate = err.code === 'ER_DUP_ENTRY';
    res.status(duplicate ? 409 : 500).json({ success: false, message: duplicate ? 'Primary group already exists.' : 'Failed to save primary group' });
  }
});

app.put('/api/primary-groups/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const name = String(req.body.name || req.body.group_name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Primary group name is required.' });
    const [result] = await pool.execute('UPDATE primary_groups SET group_name=?, description=? WHERE id=?', [name, req.body.desc || req.body.description || null, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Primary group not found.' });
    const [[row]] = await pool.execute('SELECT * FROM primary_groups WHERE id=?', [req.params.id]);
    res.json({ success: true, item: mapPrimaryGroupRow(row) });
  } catch (err) {
    console.error('Primary group update error:', err);
    const duplicate = err.code === 'ER_DUP_ENTRY';
    res.status(duplicate ? 409 : 500).json({ success: false, message: duplicate ? 'Primary group already exists.' : 'Failed to update primary group' });
  }
});

app.delete('/api/primary-groups/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const [result] = await pool.execute('DELETE FROM primary_groups WHERE id=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Primary group not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Primary group delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete primary group' });
  }
});

// Compatibility alias used by older screens/tests.
app.get('/api/primary-items', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, group_name AS name, description AS `desc` FROM primary_groups ORDER BY group_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch primary items' });
  }
});

app.post('/api/primary-items', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const name = String(req.body.name || req.body.group_name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Primary group name is required.' });
    const [result] = await pool.execute('INSERT INTO primary_groups (group_name, description) VALUES (?,?)', [name, req.body.desc || req.body.description || null]);
    res.json({ success: true, item: { id: result.insertId, name, desc: req.body.desc || req.body.description || null } });
  } catch (err) {
    res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ success: false, message: err.code === 'ER_DUP_ENTRY' ? 'Primary group already exists.' : 'Failed to save' });
  }
});

app.delete('/api/primary-items/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    await pool.execute('DELETE FROM primary_groups WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

// SUB GROUPS
app.get('/api/sub-groups', authenticateToken, async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const primaryGroupId = req.query.primary_group_id || req.query.primaryGroupId;
    const params = [];
    const where = [];
    if (search) {
      where.push('(sg.sub_group_name LIKE ? OR sg.chapter_heading_no LIKE ? OR pg.group_name LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (primaryGroupId) {
      where.push('sg.primary_group_id = ?');
      params.push(primaryGroupId);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await pool.execute(
      `SELECT sg.*, pg.group_name AS primary_group_name
       FROM sub_groups sg
       JOIN primary_groups pg ON pg.id = sg.primary_group_id
       ${whereSql}
       ORDER BY pg.group_name, sg.sub_group_name`,
      params
    );
    res.json(rows.map(mapSubGroupRow));
  } catch (err) {
    console.error('Sub group fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch sub groups' });
  }
});

app.post('/api/sub-groups', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const name = String(req.body.name || req.body.sub_group_name || '').trim();
    const primaryGroupId = req.body.primary_group_id || req.body.primaryGroupId;
    if (!name || !primaryGroupId) return res.status(400).json({ success: false, message: 'Sub group name and primary group are required.' });
    const [result] = await pool.execute(
      'INSERT INTO sub_groups (sub_group_name, primary_group_id, chapter_heading_no) VALUES (?,?,?)',
      [name, primaryGroupId, req.body.chapter_heading_no || req.body.chapterHeadingNo || null]
    );
    const [[row]] = await pool.execute(
      `SELECT sg.*, pg.group_name AS primary_group_name
       FROM sub_groups sg
       JOIN primary_groups pg ON pg.id = sg.primary_group_id
       WHERE sg.id=?`,
      [result.insertId]
    );
    res.json({ success: true, item: mapSubGroupRow(row) });
  } catch (err) {
    console.error('Sub group save error:', err);
    const duplicate = err.code === 'ER_DUP_ENTRY';
    const fk = err.code === 'ER_NO_REFERENCED_ROW_2';
    res.status(duplicate || fk ? 409 : 500).json({ success: false, message: duplicate ? 'Sub group already exists under this primary group.' : fk ? 'Selected primary group does not exist.' : 'Failed to save sub group' });
  }
});

app.put('/api/sub-groups/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const name = String(req.body.name || req.body.sub_group_name || '').trim();
    const primaryGroupId = req.body.primary_group_id || req.body.primaryGroupId;
    if (!name || !primaryGroupId) return res.status(400).json({ success: false, message: 'Sub group name and primary group are required.' });
    const [result] = await pool.execute(
      'UPDATE sub_groups SET sub_group_name=?, primary_group_id=?, chapter_heading_no=? WHERE id=?',
      [name, primaryGroupId, req.body.chapter_heading_no || req.body.chapterHeadingNo || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Sub group not found.' });
    const [[row]] = await pool.execute(
      `SELECT sg.*, pg.group_name AS primary_group_name
       FROM sub_groups sg
       JOIN primary_groups pg ON pg.id = sg.primary_group_id
       WHERE sg.id=?`,
      [req.params.id]
    );
    res.json({ success: true, item: mapSubGroupRow(row) });
  } catch (err) {
    console.error('Sub group update error:', err);
    const duplicate = err.code === 'ER_DUP_ENTRY';
    const fk = err.code === 'ER_NO_REFERENCED_ROW_2';
    res.status(duplicate || fk ? 409 : 500).json({ success: false, message: duplicate ? 'Sub group already exists under this primary group.' : fk ? 'Selected primary group does not exist.' : 'Failed to update sub group' });
  }
});

app.delete('/api/sub-groups/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
    const [result] = await pool.execute('DELETE FROM sub_groups WHERE id=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Sub group not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Sub group delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete sub group' });
  }
});
// PRODUCTS
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const rows = await getItemMasterRows(search, !isAdminUser(req.user));
    res.json(rows.map(mapProductRow));
  } catch (err) {
    console.error('Product fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    const itemCode = String(req.body.item_code || req.body.itemCode || '').trim();
    const itemName = String(req.body.item_name || req.body.name || '').trim();
    const primaryGroupId = req.body.primary_group_id || req.body.primaryGroupId;
    const subGroupId = req.body.sub_group_id || req.body.subGroupId || req.body.categoryId;
    const itemSizeId = req.body.item_size_id || req.body.itemSizeId;
    const unitId = req.body.unit_id || req.body.unitId;
    const alternateUnitId = req.body.alternate_unit_id || req.body.alternateUnitId || null;
    const listPrice = Number(req.body.list_price ?? req.body.rate ?? 0);
    const mrp = Number(req.body.mrp ?? 0);

    if (!itemCode || !itemName || !primaryGroupId || !subGroupId || !itemSizeId || !unitId) {
      return res.status(400).json({ success: false, message: 'Item code, name, group, sub group, size, and unit are required.' });
    }

    await pool.execute(
      `INSERT INTO items (
        item_code, item_name, primary_group_id, sub_group_id, item_size_id,
        unit_id, alternate_unit_id, list_price, mrp, is_active
      ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [itemCode, itemName, primaryGroupId, subGroupId, itemSizeId, unitId, alternateUnitId || null, listPrice, mrp, req.body.is_active ?? 1]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Product save error:', err);
    const duplicate = err.code === 'ER_DUP_ENTRY';
    const fk = err.code === 'ER_NO_REFERENCED_ROW_2';
    res.status(duplicate || fk ? 409 : 500).json({
      success: false,
      message: duplicate ? 'Item code already exists.' : fk ? 'Selected group, size, or unit does not exist.' : 'Failed to save product: ' + err.message
    });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    const itemCode = String(req.body.item_code || req.body.itemCode || '').trim();
    const itemName = String(req.body.item_name || req.body.name || '').trim();
    const primaryGroupId = req.body.primary_group_id || req.body.primaryGroupId;
    const subGroupId = req.body.sub_group_id || req.body.subGroupId || req.body.categoryId;
    const itemSizeId = req.body.item_size_id || req.body.itemSizeId;
    const unitId = req.body.unit_id || req.body.unitId;
    const alternateUnitId = req.body.alternate_unit_id || req.body.alternateUnitId || null;
    const listPrice = Number(req.body.list_price ?? req.body.rate ?? 0);
    const mrp = Number(req.body.mrp ?? 0);

    if (!itemCode || !itemName || !primaryGroupId || !subGroupId || !itemSizeId || !unitId) {
      return res.status(400).json({ success: false, message: 'Item code, name, group, sub group, size, and unit are required.' });
    }

    const [result] = await pool.execute(
      `UPDATE items
       SET item_code=?, item_name=?, primary_group_id=?, sub_group_id=?, item_size_id=?,
           unit_id=?, alternate_unit_id=?, list_price=?, mrp=?, is_active=?
       WHERE id=?`,
      [itemCode, itemName, primaryGroupId, subGroupId, itemSizeId, unitId, alternateUnitId || null, listPrice, mrp, req.body.is_active ?? 1, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Item not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Product update error:', err);
    const duplicate = err.code === 'ER_DUP_ENTRY';
    const fk = err.code === 'ER_NO_REFERENCED_ROW_2';
    res.status(duplicate || fk ? 409 : 500).json({
      success: false,
      message: duplicate ? 'Item code already exists.' : fk ? 'Selected group, size, or unit does not exist.' : 'Failed to update product'
    });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    await pool.execute('DELETE FROM items WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Product delete error:', err);
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
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    const { name } = req.body;
    await pool.execute('INSERT INTO product_categories (name) VALUES (?)', [name]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save' });
  }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    await pool.execute('DELETE FROM product_categories WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

// UNITS
app.get('/api/units', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM item_units ORDER BY unit_name');
    res.json(rows.map(mapUnitRow));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch units' });
  }
});

app.post('/api/units', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    const name = String(req.body.name || req.body.unit_name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Unit name is required.' });
    await pool.execute('INSERT INTO item_units (name, unit_name, description) VALUES (?,?,?)', [name, name, req.body.description || null]);
    res.json({ success: true });
  } catch (err) {
    res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ success: false, message: err.code === 'ER_DUP_ENTRY' ? 'Unit already exists.' : 'Failed to save' });
  }
});

app.put('/api/units/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    const name = String(req.body.name || req.body.unit_name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Unit name is required.' });
    const [result] = await pool.execute('UPDATE item_units SET name=?, unit_name=?, description=? WHERE id=?', [name, name, req.body.description || null, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Unit not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ success: false, message: err.code === 'ER_DUP_ENTRY' ? 'Unit already exists.' : 'Failed to update' });
  }
});

app.delete('/api/units/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    await pool.execute('DELETE FROM item_units WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

// SIZES
app.get('/api/sizes', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM item_sizes ORDER BY size_code');
    res.json(rows.map(mapSizeRow));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sizes' });
  }
});

app.post('/api/sizes', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    const name = String(req.body.name || req.body.size_code || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Size code is required.' });
    await pool.execute('INSERT INTO item_sizes (name, size_code, description) VALUES (?,?,?)', [name, name, req.body.description || null]);
    res.json({ success: true });
  } catch (err) {
    res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ success: false, message: err.code === 'ER_DUP_ENTRY' ? 'Size already exists.' : 'Failed to save' });
  }
});

app.put('/api/sizes/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    const name = String(req.body.name || req.body.size_code || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Size code is required.' });
    const [result] = await pool.execute('UPDATE item_sizes SET name=?, size_code=?, description=? WHERE id=?', [name, name, req.body.description || null, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Size not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ success: false, message: err.code === 'ER_DUP_ENTRY' ? 'Size already exists.' : 'Failed to update' });
  }
});

app.delete('/api/sizes/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    await pool.execute('DELETE FROM item_sizes WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete' });
  }
});

// SHIPPING CARRIERS
app.get('/api/shipping-carriers', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM shipping_carriers ORDER BY method_name');
    res.json(rows.map(mapShippingCarrierRow));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch shipping carriers' });
  }
});

app.post('/api/shipping-carriers', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    const name = String(req.body.name || req.body.method_name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Shipping method name is required.' });
    await pool.execute('INSERT INTO shipping_carriers (method_name) VALUES (?)', [name]);
    res.json({ success: true });
  } catch (err) {
    res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ success: false, message: err.code === 'ER_DUP_ENTRY' ? 'Shipping carrier already exists.' : 'Failed to save shipping carrier' });
  }
});

app.put('/api/shipping-carriers/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    const name = String(req.body.name || req.body.method_name || '').trim();
    if (!name) return res.status(400).json({ success: false, message: 'Shipping method name is required.' });
    const [result] = await pool.execute('UPDATE shipping_carriers SET method_name=? WHERE id=?', [name, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Shipping carrier not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ success: false, message: err.code === 'ER_DUP_ENTRY' ? 'Shipping carrier already exists.' : 'Failed to update shipping carrier' });
  }
});

app.delete('/api/shipping-carriers/:id', authenticateToken, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
    const [result] = await pool.execute('DELETE FROM shipping_carriers WHERE id=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Shipping carrier not found.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete shipping carrier' });
  }
});

// LEADS
app.get('/api/leads', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM leads';
    let params = [];

    // Horizontal RBAC: Customers only see their own leads, Admins see all
    if (!isAdminUser(req.user)) {
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

    if (!isAdminUser(req.user) && leads[0].userId !== req.user.id) {
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

    if (!isAdminUser(req.user)) {
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
      SELECT
        sc.*,
        COALESCE(sc.challan_no, sc.challanNo) AS challan_no,
        COALESCE(sc.challan_date, sc.challanDate) AS challan_date,
        o.order_no,
        c.company_id_code,
        c.company_name,
        c.email AS company_email,
        car.method_name
      FROM supply_challans sc
      LEFT JOIN orders o ON o.id = sc.order_id
      LEFT JOIN companies c ON c.id = sc.company_id OR c.company_id_code = sc.companyId
      LEFT JOIN shipping_carriers car ON car.id = sc.carrier_id
    `;
    let params = [];
    let where = [];

    if (!isAdminUser(req.user)) {
      const company = await getCompanyForRequest(req.user);
      if (!company) return res.json([]);
      where.push('(sc.company_id = ? OR sc.companyId = ?)');
      params.push(company.id, company.company_id_code);
    }

    if (companyId && isAdminUser(req.user)) {
      where.push('(sc.company_id = ? OR sc.companyId = ? OR c.company_id_code = ?)');
      params.push(companyId, companyId, companyId);
    }
    if (fromDate) { where.push('COALESCE(sc.challan_date, sc.challanDate) >= ?'); params.push(fromDate); }
    if (toDate) { where.push('COALESCE(sc.challan_date, sc.challanDate) <= ?'); params.push(toDate); }

    if (where.length > 0) query += ' WHERE ' + where.join(' AND ');

    query += ' ORDER BY COALESCE(sc.challan_date, sc.challanDate) DESC, sc.id DESC';
    const [rows] = await pool.execute(query, params);
    res.json(rows.map(mapChallanRow));
  } catch (err) {
    console.error('Supply fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch supplies' });
  }
});

app.post('/api/challans', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({ success: false, message: 'Admin only access.' });
    }
    const challanNo = String(req.body.challanNo || req.body.challan_no || '').trim();
    const orderNo = String(req.body.orderNo || req.body.order_no || '').trim();
    const carrierId = Number(req.body.carrierId || req.body.carrier_id);
    const challanDate = req.body.challanDate || req.body.challan_date || new Date().toISOString().split('T')[0];
    const supplyDetails = String(req.body.supplyDetails || req.body.supply_details || '').trim();

    if (!challanNo || !orderNo || !carrierId || !challanDate) {
      return res.status(400).json({ success: false, message: 'Challan no, accepted order, carrier, and challan date are required.' });
    }

    await connection.beginTransaction();

    const [orderRows] = await connection.execute(
      `SELECT o.*, c.company_id_code, c.company_name, c.email AS company_email
       FROM orders o
       JOIN companies c ON c.id = o.company_id
       WHERE o.order_no = ? OR o.orderNo = ?
       LIMIT 1`,
      [orderNo, orderNo]
    );
    const order = orderRows[0];
    if (!order) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (normalizeOrderStatus(order.order_status || order.status) !== 'ACCEPTED') {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'Only accepted orders can receive challan details.' });
    }

    const [carrierRows] = await connection.execute('SELECT id, method_name FROM shipping_carriers WHERE id = ? LIMIT 1', [carrierId]);
    const carrier = carrierRows[0];
    if (!carrier) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Shipping carrier not found.' });
    }

    await connection.execute(
      `INSERT INTO supply_challans (
        challanNo, challan_no, companyId, company_id, order_id, carrier_id,
        challanDate, challan_date, uploadedBy, supply_details
      ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        challanNo,
        challanNo,
        order.company_id_code,
        order.company_id,
        order.id,
        carrierId,
        challanDate,
        challanDate,
        req.user.id,
        supplyDetails || null,
      ]
    );

    await connection.execute(
      "UPDATE orders SET status='Dispatched', order_status='DISPATCHED', trackingNo=?, review_date=NOW() WHERE id=?",
      [challanNo, order.id]
    );

    await connection.commit();

    const challan = {
      challan_no: challanNo,
      order_no: order.order_no || order.orderNo,
      company_email: order.company_email,
      carrier_name: carrier.method_name,
      challan_date: challanDate,
    };
    await notifyChallanCreated(challan);
    res.status(201).json({ success: true, message: 'Challan uploaded successfully', challan: mapChallanRow(challan) });
  } catch (err) {
    await connection.rollback();
    console.error('Challan upload error:', err);
    const duplicate = err.code === 'ER_DUP_ENTRY';
    res.status(duplicate ? 409 : 500).json({ success: false, message: duplicate ? 'Challan number already exists.' : 'Failed to upload challan: ' + err.message });
  } finally {
    connection.release();
  }
});

app.get('/api/challans/company/:companyId', authenticateToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!isAdminUser(req.user)) {
      const company = await getCompanyForRequest(req.user);
      if (!company || String(company.id) !== String(companyId)) return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const [rows] = await pool.execute(
      `SELECT
        sc.*,
        COALESCE(sc.challan_no, sc.challanNo) AS challan_no,
        COALESCE(sc.challan_date, sc.challanDate) AS challan_date,
        o.order_no,
        c.company_id_code,
        c.company_name,
        car.method_name
       FROM supply_challans sc
       LEFT JOIN orders o ON o.id = sc.order_id
       LEFT JOIN companies c ON c.id = sc.company_id OR c.company_id_code = sc.companyId
       LEFT JOIN shipping_carriers car ON car.id = sc.carrier_id
       WHERE sc.company_id = ? OR sc.companyId = ? OR c.company_id_code = ?
       ORDER BY COALESCE(sc.challan_date, sc.challanDate) DESC, sc.id DESC`,
      [companyId, companyId, companyId]
    );
    res.json(rows.map(mapChallanRow));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch challans: ' + err.message });
  }
});

app.get('/api/exports/:type', authenticateToken, async (req, res) => {
  try {
    const type = String(req.params.type || '').toLowerCase();
    const today = new Date().toISOString().split('T')[0];

    if (type === 'catalog') {
      const rows = await getItemMasterRows(String(req.query.search || '').trim(), false);
      return sendWorkbook(
        res,
        rows.map((row) => ({
          'Item Code': row.item_code,
          'Item Name': row.item_name,
          'Primary Group': row.primary_group_name,
          'Sub Group': row.sub_group_name,
          Size: row.size_code,
          Unit: row.unit_name,
          'Alternate Unit': row.alternate_unit_name || '',
          'List Price': Number(row.list_price || 0),
          MRP: Number(row.mrp || 0),
          Active: row.is_active ? 'Yes' : 'No',
        })),
        'Catalog',
        `maco_catalog_${today}.xlsx`
      );
    }

    if (type === 'orders') {
      if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only access.' });
      const [rows] = await pool.execute(
        `SELECT o.order_no, c.company_id_code, c.company_name, o.requisition_no, o.po_date,
                o.destination, o.net_amount, o.order_status, o.paymentStatus, o.trackingNo, o.created_at
         FROM orders o
         LEFT JOIN companies c ON c.id = o.company_id
         ORDER BY o.created_at DESC, o.id DESC`
      );
      return sendWorkbook(
        res,
        rows.map((row) => ({
          'Order No': row.order_no,
          'Company Code': row.company_id_code,
          Company: row.company_name,
          Requisition: row.requisition_no || '',
          'PO Date': row.po_date,
          Destination: row.destination,
          'Net Amount': Number(row.net_amount || 0),
          Status: row.order_status,
          Payment: row.paymentStatus || 'Unpaid',
          Tracking: row.trackingNo || '',
          Created: row.created_at,
        })),
        'Orders',
        `maco_orders_${today}.xlsx`
      );
    }

    if (type === 'supplies') {
      const params = [];
      let where = '';
      if (!isAdminUser(req.user)) {
        const company = await getCompanyForRequest(req.user);
        if (!company) return sendWorkbook(res, [], 'Supplies', `maco_supplies_${today}.xlsx`);
        where = 'WHERE sc.company_id = ? OR sc.companyId = ?';
        params.push(company.id, company.company_id_code);
      }
      const [rows] = await pool.execute(
        `SELECT COALESCE(sc.challan_no, sc.challanNo) AS challan_no,
                COALESCE(sc.challan_date, sc.challanDate) AS challan_date,
                sc.supply_details, o.order_no, c.company_id_code, c.company_name, car.method_name
         FROM supply_challans sc
         LEFT JOIN orders o ON o.id = sc.order_id
         LEFT JOIN companies c ON c.id = sc.company_id OR c.company_id_code = sc.companyId
         LEFT JOIN shipping_carriers car ON car.id = sc.carrier_id
         ${where}
         ORDER BY COALESCE(sc.challan_date, sc.challanDate) DESC, sc.id DESC`,
        params
      );
      return sendWorkbook(
        res,
        rows.map((row) => ({
          'Challan No': row.challan_no,
          'Order No': row.order_no || '',
          'Company Code': row.company_id_code || '',
          Company: row.company_name || '',
          Carrier: row.method_name || '',
          'Challan Date': row.challan_date,
          Details: row.supply_details || '',
        })),
        'Supplies',
        `maco_supplies_${today}.xlsx`
      );
    }

    return res.status(404).json({ success: false, message: 'Unknown export type.' });
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ success: false, message: 'Failed to export data.' });
  }
});

if (require.main === module) {
  dbReady
    .then(() => {
      // REPORTING
      app.get('/api/reports/sales', authenticateToken, async (req, res) => {
        try {
          if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
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
          if (!isAdminUser(req.user)) return res.status(403).json({ success: false, message: 'Admin only' });
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
