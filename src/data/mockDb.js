const STORAGE_KEY = 'maco_demo_db_v1';

const today = new Date().toISOString().split('T')[0];

const seedData = {
    users: [
        {
            id: 1,
            email: 'admin@maco.demo',
            username: 'admin',
            password: 'demo123',
            role: 'admin',
            role_master: 'ADMIN',
            fullname: 'MACO Admin'
        },
        {
            id: 2,
            email: 'customer@maco.demo',
            username: 'customer',
            password: 'demo123',
            role: 'customer',
            role_master: 'CUSTOMER',
            fullname: 'North Star Textiles',
            company_id_code: 'M10001'
        }
    ],
    pendingUsers: [
        { id: 11, fullname: 'Rohan Kapoor', email: 'rohan@demo-client.com', role: 'customer', status: 'pending' },
        { id: 12, fullname: 'Meera Shah', email: 'meera@demo-client.com', role: 'customer', status: 'pending' }
    ],
    companies: [
        {
            id: 1,
            companyId: 'M10001',
            company_id_code: 'M10001',
            name: 'North Star Textiles',
            company_name: 'North Star Textiles',
            username: 'customer',
            first_name: 'Amit',
            last_name: 'Verma',
            email: 'customer@maco.demo',
            contact: '9876543210',
            contact_no: '9876543210',
            address_1: 'Plot 12, Industrial Area',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001',
            pan_no: 'ABCDE1234F',
            tin_no: 'TIN-10001',
            role_master: 'CUSTOMER',
            isActive: true,
            is_active: true
        },
        {
            id: 2,
            companyId: 'M10002',
            company_id_code: 'M10002',
            name: 'Blue Ridge Components',
            company_name: 'Blue Ridge Components',
            username: 'blueridge',
            first_name: 'Priya',
            last_name: 'Nair',
            email: 'orders@blueridge.demo',
            contact: '9988776655',
            contact_no: '9988776655',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411001',
            pan_no: 'BLUER1234F',
            tin_no: 'TIN-10002',
            role_master: 'CUSTOMER',
            isActive: true,
            is_active: true
        },
        {
            id: 3,
            companyId: 'M10003',
            company_id_code: 'M10003',
            name: 'Eastern Retail Supply',
            company_name: 'Eastern Retail Supply',
            username: 'eastern',
            email: 'purchase@eastern.demo',
            contact: '9123456789',
            contact_no: '9123456789',
            city: 'Kolkata',
            state: 'West Bengal',
            pincode: '700001',
            pan_no: 'EASTR1234F',
            tin_no: 'TIN-10003',
            role_master: 'CUSTOMER',
            isActive: false,
            is_active: false
        }
    ],
    categories: [
        { id: 1, name: 'Industrial Fabric' },
        { id: 2, name: 'Packaging Material' },
        { id: 3, name: 'Safety Supplies' }
    ],
    units: [
        { id: 1, name: 'Meters', unit_name: 'Meters', description: 'Linear measurement' },
        { id: 2, name: 'Pieces', unit_name: 'Pieces', description: 'Discrete units' },
        { id: 3, name: 'Kilograms', unit_name: 'Kilograms', description: 'Weight based' }
    ],
    sizes: [
        { id: 1, name: 'Small', size_code: 'Small', description: 'S' },
        { id: 2, name: 'Medium', size_code: 'Medium', description: 'M' },
        { id: 3, name: 'Large', size_code: 'Large', description: 'L' }
    ],
    primaryItems: [
        { id: 1, name: 'Cotton Blend', desc: 'Cotton blend material' },
        { id: 2, name: 'Poly Sheets', desc: 'Packaging sheets' },
        { id: 3, name: 'Safety Gloves', desc: 'Industrial gloves' }
    ],
    primaryGroups: [
        { id: 1, name: 'Textile Raw Material', group_name: 'Textile Raw Material', description: 'Fabric and allied goods' },
        { id: 2, name: 'Packaging', group_name: 'Packaging', description: 'Packing and dispatch material' }
    ],
    subGroups: [
        { id: 1, name: 'Cotton Fabric', sub_group_name: 'Cotton Fabric', primary_group_id: 1, primaryGroupName: 'Textile Raw Material' },
        { id: 2, name: 'Corrugated Sheets', sub_group_name: 'Corrugated Sheets', primary_group_id: 2, primaryGroupName: 'Packaging' }
    ],
    shippingCarriers: [
        { id: 1, name: 'BlueDart Surface', method_name: 'BlueDart Surface' },
        { id: 2, name: 'Delhivery Freight', method_name: 'Delhivery Freight' },
        { id: 3, name: 'VRL Logistics', method_name: 'VRL Logistics' }
    ],
    products: [
        {
            id: 101,
            itemCode: 'FAB-COT-001',
            item_code: 'FAB-COT-001',
            name: 'Cotton Drill Fabric',
            item_name: 'Cotton Drill Fabric',
            primary_group_id: 1,
            primaryGroupName: 'Textile Raw Material',
            sub_group_id: 1,
            subGroupName: 'Cotton Fabric',
            item_size_id: 3,
            size: 'Large',
            unit_id: 1,
            uom: 'Meters',
            category: 'Industrial Fabric',
            description: 'Heavy cotton drill fabric for uniforms and industrial applications.',
            specifications: 'Heavy cotton drill fabric for uniforms and industrial applications.',
            rate: 145,
            list_price: 145,
            mrp: 175,
            imageUrl: 'https://via.placeholder.com/300x200?text=Cotton+Drill+Fabric'
        },
        {
            id: 102,
            itemCode: 'PKG-COR-001',
            item_code: 'PKG-COR-001',
            name: 'Corrugated Packing Sheet',
            item_name: 'Corrugated Packing Sheet',
            primary_group_id: 2,
            primaryGroupName: 'Packaging',
            sub_group_id: 2,
            subGroupName: 'Corrugated Sheets',
            item_size_id: 2,
            size: 'Medium',
            unit_id: 2,
            uom: 'Pieces',
            category: 'Packaging Material',
            description: 'Corrugated sheet for safe dispatch packing.',
            specifications: 'Corrugated sheet for safe dispatch packing.',
            rate: 32,
            list_price: 32,
            mrp: 40,
            imageUrl: 'https://via.placeholder.com/300x200?text=Corrugated+Sheet'
        },
        {
            id: 103,
            itemCode: 'SAFE-GLV-001',
            item_code: 'SAFE-GLV-001',
            name: 'Nitrile Safety Gloves',
            item_name: 'Nitrile Safety Gloves',
            primary_group_id: 1,
            primaryGroupName: 'Textile Raw Material',
            sub_group_id: 1,
            subGroupName: 'Cotton Fabric',
            item_size_id: 1,
            size: 'Small',
            unit_id: 2,
            uom: 'Pieces',
            category: 'Safety Supplies',
            description: 'Industrial nitrile safety gloves for shop floor use.',
            specifications: 'Industrial nitrile safety gloves for shop floor use.',
            rate: 18,
            list_price: 18,
            mrp: 25,
            imageUrl: 'https://via.placeholder.com/300x200?text=Nitrile+Gloves'
        }
    ],
    orders: [
        {
            id: 1,
            orderNo: 'M202600001',
            order_no: 'M202600001',
            company_id: 1,
            customer: 'North Star Textiles',
            requisition: 'PO-248901',
            requisition_no: 'PO-248901',
            poDate: '2026-07-05',
            po_date: '2026-07-05',
            destination: 'New Delhi Warehouse',
            amount: 98250,
            net_amount: 98250,
            status: 'Pending',
            order_status: 'PENDING',
            paymentStatus: 'Unpaid',
            trackingNo: ''
        },
        {
            id: 2,
            orderNo: 'M202600002',
            order_no: 'M202600002',
            company_id: 2,
            customer: 'Blue Ridge Components',
            requisition: 'PO-248902',
            requisition_no: 'PO-248902',
            poDate: '2026-07-08',
            po_date: '2026-07-08',
            destination: 'Pune Plant',
            amount: 54320,
            net_amount: 54320,
            status: 'Accepted',
            order_status: 'ACCEPTED',
            paymentStatus: 'Paid',
            trackingNo: ''
        },
        {
            id: 3,
            orderNo: 'M202600003',
            order_no: 'M202600003',
            company_id: 1,
            customer: 'North Star Textiles',
            requisition: 'PO-248903',
            requisition_no: 'PO-248903',
            poDate: '2026-07-10',
            po_date: '2026-07-10',
            destination: 'New Delhi Warehouse',
            amount: 27750,
            net_amount: 27750,
            status: 'Dispatched',
            order_status: 'DISPATCHED',
            paymentStatus: 'Paid',
            trackingNo: 'CH-DEL-2198'
        }
    ],
    orderItems: {
        M202600001: [
            { itemName: 'Cotton Drill Fabric', quantity: 450, price: 145, size: 'Large', uom: 'Meters' },
            { itemName: 'Nitrile Safety Gloves', quantity: 800, price: 18, size: 'Small', uom: 'Pieces' }
        ],
        M202600002: [
            { itemName: 'Corrugated Packing Sheet', quantity: 1200, price: 32, size: 'Medium', uom: 'Pieces' },
            { itemName: 'Nitrile Safety Gloves', quantity: 884, price: 18, size: 'Small', uom: 'Pieces' }
        ],
        M202600003: [
            { itemName: 'Cotton Drill Fabric', quantity: 150, price: 145, size: 'Large', uom: 'Meters' },
            { itemName: 'Corrugated Packing Sheet', quantity: 188, price: 32, size: 'Medium', uom: 'Pieces' }
        ]
    },
    supplies: [
        {
            id: 1,
            challanNo: 'CH-DEL-2198',
            challan_no: 'CH-DEL-2198',
            orderNo: 'M202600003',
            order_no: 'M202600003',
            companyId: 'M10001',
            companyName: 'North Star Textiles',
            carrierId: 2,
            carrierName: 'Delhivery Freight',
            challanDate: '2026-07-12',
            challan_date: '2026-07-12',
            quantity: 338,
            supplyDetails: '12 boxes dispatched to Delhi warehouse.'
        }
    ],
    leads: [
        { id: 1, name: 'Vertex Apparel', email: 'buying@vertex.demo', phone: '9000011111', status: 'New', companyId: 'M10004', createdAt: '2026-07-14' },
        { id: 2, name: 'Apex Packaging', email: 'ops@apex.demo', phone: '9000022222', status: 'Qualified', companyId: 'M10005', createdAt: '2026-07-15' }
    ],
    deals: [
        { id: 1, name: 'Uniform Fabric Annual Supply', amount: 750000, stage: 'Proposal', leadId: 1, createdAt: '2026-07-15' },
        { id: 2, name: 'Packing Sheet Contract', amount: 340000, stage: 'Negotiation', leadId: 2, createdAt: '2026-07-16' }
    ],
    tasks: [
        { id: 1, title: 'Send revised quote to Vertex', description: 'Include volume discount slab.', dueDate: '2026-07-20', status: 'Pending' },
        { id: 2, title: 'Follow up on Blue Ridge payment', description: 'Confirm July statement.', dueDate: '2026-07-22', status: 'Pending' }
    ]
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function loadDb() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
        return clone(seedData);
    }
    try {
        const db = { ...clone(seedData), ...JSON.parse(saved) };
        let shouldSave = false;
        if (!Array.isArray(db.products) || db.products.length === 0) {
            db.products = clone(seedData.products);
            shouldSave = true;
        }
        db.leads = (db.leads || []).map((lead, index) => {
            if (lead.createdAt) return lead;
            shouldSave = true;
            return { ...lead, createdAt: seedData.leads[index]?.createdAt || today };
        });
        db.deals = (db.deals || []).map((deal, index) => {
            if (deal.createdAt) return deal;
            shouldSave = true;
            return { ...deal, createdAt: seedData.deals[index]?.createdAt || today };
        });
        db.tasks = (db.tasks || []).map(task => {
            if (task.status) return task;
            shouldSave = true;
            return { ...task, status: 'Pending' };
        });
        if (shouldSave) saveDb(db);
        return db;
    } catch {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
        return clone(seedData);
    }
}

function saveDb(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function nextId(rows) {
    return Math.max(0, ...rows.map(row => Number(row.id) || 0)) + 1;
}

function getNextCustomerIdFromDb(db) {
    const customerIds = [
        ...db.companies.map(item => item.companyId || item.company_id_code),
        ...db.pendingUsers.map(item => item.companyId || item.company_id_code || item.customerDetails?.companyId)
    ];
    const maxNumber = customerIds.reduce((max, value) => {
        const match = String(value || '').match(/^M(\d+)$/i);
        if (!match) return max;
        return Math.max(max, Number.parseInt(match[1], 10));
    }, 10000);

    return `M${String(maxNumber + 1).padStart(5, '0')}`;
}

function normalizeOrderStatus(status) {
    const value = String(status || 'Pending').toUpperCase();
    if (value === 'ACCEPTED') return 'Accepted';
    if (value === 'REJECTED') return 'Rejected';
    if (value === 'DISPATCHED') return 'Dispatched';
    return 'Pending';
}

function orderStatusCode(status) {
    return normalizeOrderStatus(status).toUpperCase();
}

function currentCompany(db) {
    const user = JSON.parse(localStorage.getItem('maco_user') || 'null');
    return db.companies.find(company => company.companyId === user?.companyIdCode) || db.companies[0];
}

function filterByText(rows, search, fields) {
    const query = String(search || '').trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(row => fields.some(field => String(row[field] || '').toLowerCase().includes(query)));
}

function collectionName(entity) {
    return {
        categories: 'categories',
        units: 'units',
        sizes: 'sizes',
        'primary-items': 'primaryItems',
        'primary-groups': 'primaryGroups',
        'sub-groups': 'subGroups',
        'shipping-carriers': 'shippingCarriers',
        products: 'products'
    }[entity];
}

function buildActivityNotifications(db, viewer = {}) {
    const role = String(viewer.role || '').toLowerCase();
    const companyIdCode = viewer.companyIdCode;
    const currentCompanyRow = companyIdCode
        ? db.companies.find(company => company.companyId === companyIdCode || company.company_id_code === companyIdCode)
        : null;
    const currentCompanyId = currentCompanyRow?.id;
    const isCustomer = role === 'customer';
    const visibleOrders = isCustomer
        ? db.orders.filter(order => Number(order.company_id) === Number(currentCompanyId))
        : db.orders;
    const visibleSupplies = isCustomer
        ? db.supplies.filter(supply => supply.companyId === companyIdCode)
        : db.supplies;

    const activities = [
        ...(!isCustomer
            ? (db.pendingUsers || []).map(user => ({
                id: `registration-${user.id}`,
                type: 'registration',
                title: `${user.fullname || user.company_name || 'New customer'} registered`,
                message: `${user.email || 'Customer account'} is waiting for admin approval.`,
                createdAt: user.createdAt || '2026-07-17T10:15:00.000Z'
            }))
            : []),
        ...visibleOrders.map(order => ({
            id: `order-${order.orderNo || order.order_no}`,
            type: 'order',
            title: `${order.customer || 'Customer'} placed ${order.orderNo || order.order_no}`,
            message: `${order.status || 'Pending'} order worth Rs. ${Number(order.amount || order.net_amount || 0).toLocaleString('en-IN')}.`,
            createdAt: `${order.poDate || order.po_date || today}T09:30:00.000Z`
        })),
        ...visibleSupplies.map(supply => ({
            id: `supply-${supply.challanNo || supply.challan_no}`,
            type: 'supply',
            title: `Challan ${supply.challanNo || supply.challan_no} uploaded`,
            message: `${supply.companyName || 'Customer'} supply update for order ${supply.orderNo || supply.order_no}.`,
            createdAt: `${supply.challanDate || supply.challan_date || today}T13:20:00.000Z`
        })),
        ...(!isCustomer
            ? (db.tasks || []).map(task => ({
                id: `task-${task.id}`,
                type: 'task',
                title: task.title,
                message: `${task.status || 'Pending'} task due on ${task.dueDate || today}.`,
                createdAt: `${task.dueDate || today}T08:00:00.000Z`
            }))
            : [])
    ];

    return activities
        .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
        .slice(0, 12);
}

export const MockDb = {
    reset() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
        return clone(seedData);
    },

    login(identifier, password) {
        const db = loadDb();
        const loginValue = String(identifier || '').toLowerCase();
        const user = db.users.find(item =>
            item.email.toLowerCase() === loginValue ||
            item.username.toLowerCase() === loginValue
        );
        const passwordMatches = user && (user.password === password || user.username === password);
        if (!user || !passwordMatches) {
            throw new Error('Use admin/admin, customer/customer, or the demo email accounts with password demo123');
        }
        return {
            success: true,
            role: user.role,
            roleMaster: user.role_master,
            username: user.username,
            companyIdCode: user.company_id_code,
            token: `demo-token-${user.role}`
        };
    },

    register(fullname, email, password, role = 'customer', customerDetails = {}) {
        const db = loadDb();
        const normalizedEmail = String(email).toLowerCase();
        const emailExists = db.users.some(user => user.email.toLowerCase() === normalizedEmail) ||
            db.pendingUsers.some(user => String(user.email).toLowerCase() === normalizedEmail);
        if (emailExists) {
            throw new Error('This email already exists in the demo data.');
        }
        const details = {
            companyId: customerDetails.companyId,
            company_id_code: customerDetails.companyId,
            customerName: customerDetails.customerName,
            company_name: customerDetails.customerName,
            username: customerDetails.username,
            first_name: customerDetails.firstName,
            last_name: customerDetails.lastName,
            contact: customerDetails.contact,
            contact_no: customerDetails.contact,
            address_1: customerDetails.address1,
            address_2: customerDetails.address2,
            city: customerDetails.city,
            state: customerDetails.state,
            pincode: customerDetails.pincode,
            pan_no: customerDetails.panNo,
            gstin_no: customerDetails.gstinNo,
            registration_no: customerDetails.registrationNo,
            role_master: 'CUSTOMER'
        };
        const user = {
            id: nextId(db.pendingUsers),
            fullname,
            email,
            password,
            role,
            status: 'pending',
            createdAt: new Date().toISOString(),
            customerDetails: details,
            ...details
        };
        db.pendingUsers.push(user);
        saveDb(db);
        return { success: true, user, message: 'Demo registration submitted for admin approval.' };
    },

    getNextCustomerId() {
        const db = loadDb();
        return getNextCustomerIdFromDb(db);
    },

    changePassword(username, currentPassword, newPassword) {
        const db = loadDb();
        const user = db.users.find(item => item.username === username);
        if (!user || user.role !== 'admin') {
            throw new Error('Only an administrator can change the admin password.');
        }
        if (user.password !== currentPassword && user.username !== currentPassword) {
            throw new Error('Current password is incorrect.');
        }
        user.password = newPassword;
        saveDb(db);
        return { success: true, message: 'Admin password updated successfully.' };
    },

    getPendingUsers() {
        return loadDb().pendingUsers.filter(user => user.status === 'pending');
    },

    approveUser(id) {
        const db = loadDb();
        const user = db.pendingUsers.find(item => String(item.id) === String(id));
        if (user) {
            const details = user.customerDetails || user;
            const companyId = details.companyId || details.company_id_code || getNextCustomerIdFromDb(db);
            const companyName = details.customerName || details.company_name || user.fullname || 'Customer Account';
            const username = details.username || user.username || user.email;
            const customer = {
                id: db.companies.find(item => item.companyId === companyId || item.company_id_code === companyId)?.id || nextId(db.companies),
                companyId,
                company_id_code: companyId,
                name: companyName,
                company_name: companyName,
                username,
                first_name: details.first_name || '',
                last_name: details.last_name || '',
                email: user.email,
                contact: details.contact || details.contact_no || '',
                contact_no: details.contact_no || details.contact || '',
                address_1: details.address_1 || '',
                address_2: details.address_2 || '',
                city: details.city || '',
                state: details.state || '',
                pincode: details.pincode || '',
                pan_no: details.pan_no || '',
                gstin_no: details.gstin_no || '',
                registration_no: details.registration_no || '',
                role_master: 'CUSTOMER',
                isActive: true,
                is_active: true
            };
            const companyIndex = db.companies.findIndex(item => item.companyId === companyId || item.company_id_code === companyId);
            if (companyIndex >= 0) db.companies[companyIndex] = { ...db.companies[companyIndex], ...customer };
            else db.companies.push(customer);

            const existingUserIndex = db.users.findIndex(item => String(item.email).toLowerCase() === String(user.email).toLowerCase());
            const approvedUser = {
                id: existingUserIndex >= 0 ? db.users[existingUserIndex].id : nextId(db.users),
                email: user.email,
                username,
                password: user.password,
                role: 'customer',
                role_master: 'CUSTOMER',
                fullname: user.fullname || companyName,
                company_id_code: companyId,
                status: 'approved'
            };
            if (existingUserIndex >= 0) db.users[existingUserIndex] = { ...db.users[existingUserIndex], ...approvedUser };
            else db.users.push(approvedUser);

            user.status = 'approved';
            user.companyId = companyId;
            user.company_id_code = companyId;
        }
        saveDb(db);
        return { success: true };
    },

    rejectUser(id) {
        const db = loadDb();
        const user = db.pendingUsers.find(item => String(item.id) === String(id));
        if (user) user.status = 'rejected';
        saveDb(db);
        return { success: true };
    },

    getCustomers(search = '') {
        return filterByText(loadDb().companies, search, ['companyId', 'name', 'username', 'email', 'city', 'pan_no', 'tin_no']);
    },

    saveCustomer(customerData) {
        const db = loadDb();
        const id = customerData.id || nextId(db.companies);
        const companyId = customerData.companyId || customerData.company_id_code || getNextCustomerIdFromDb(db);
        const username = customerData.username || companyId;
        const customer = {
            ...customerData,
            id,
            companyId,
            company_id_code: companyId,
            name: customerData.name || customerData.company_name,
            company_name: customerData.name || customerData.company_name,
            username,
            contact: customerData.contact || customerData.contact_no,
            contact_no: customerData.contact || customerData.contact_no,
            isActive: Boolean(customerData.isActive ?? customerData.is_active ?? true),
            is_active: Boolean(customerData.isActive ?? customerData.is_active ?? true)
        };
        const index = db.companies.findIndex(item => String(item.id) === String(id));
        if (index >= 0) db.companies[index] = customer;
        else db.companies.push(customer);

        if (customer.email) {
            const userIndex = db.users.findIndex(user => String(user.email).toLowerCase() === String(customer.email).toLowerCase());
            const existingUser = userIndex >= 0 ? db.users[userIndex] : {};
            const userRecord = {
                ...existingUser,
                id: existingUser.id || nextId(db.users),
                email: customer.email,
                username,
                password: customerData.password || existingUser.password || username,
                role: String(customer.role_master || 'CUSTOMER').toLowerCase() === 'admin' ? 'admin' : 'customer',
                role_master: customer.role_master || 'CUSTOMER',
                fullname: customer.name,
                company_id_code: companyId,
                status: customer.isActive ? 'approved' : 'inactive'
            };
            if (userIndex >= 0) db.users[userIndex] = userRecord;
            else db.users.push(userRecord);
        }

        saveDb(db);
        return { success: true, customer };
    },

    deleteCustomer(id) {
        const db = loadDb();
        db.companies = db.companies.filter(customer => String(customer.id) !== String(id));
        saveDb(db);
        return { success: true };
    },

    getCompanies(search = '') {
        return this.getCustomers(search);
    },

    saveCompany(companyData) {
        return this.saveCustomer(companyData);
    },

    deleteCompany(id) {
        return this.deleteCustomer(id);
    },

    getOrders() {
        const db = loadDb();
        const user = JSON.parse(localStorage.getItem('maco_user') || 'null');
        if (user?.role === 'customer') {
            const company = currentCompany(db);
            return db.orders.filter(order => Number(order.company_id) === Number(company.id));
        }
        return db.orders;
    },

    getOrderDetails(orderNo) {
        const db = loadDb();
        const order = db.orders.find(item => item.orderNo === orderNo);
        if (!order) return { success: false, message: 'Order not found' };
        return { success: true, order, items: db.orderItems[orderNo] || [] };
    },

    getDashboardStats() {
        const orders = this.getOrders();
        return {
            totalOrders: orders.length,
            pendingOrders: orders.filter(order => order.status === 'Pending').length,
            acceptedOrders: orders.filter(order => order.status === 'Accepted').length,
            dispatchedOrders: orders.filter(order => order.status === 'Dispatched').length,
            revenue: orders.reduce((sum, order) => sum + Number(order.amount || 0), 0)
        };
    },

    getActivityNotifications(viewer = {}) {
        return buildActivityNotifications(loadDb(), viewer);
    },

    updateOrder(orderNo, data) {
        const db = loadDb();
        const order = db.orders.find(item => item.orderNo === orderNo);
        if (!order) return { success: false, message: 'Order not found' };
        const nextStatus = normalizeOrderStatus(data.status || order.status);
        Object.assign(order, data, {
            status: nextStatus,
            order_status: orderStatusCode(nextStatus),
            ...(nextStatus === 'Accepted' || nextStatus === 'Rejected' ? { acceptDate: data.acceptDate || order.acceptDate || today } : {})
        });
        saveDb(db);
        return { success: true, order };
    },

    approveOrder(orderNo) {
        return this.updateOrder(orderNo, { status: 'Accepted' });
    },

    rejectOrder(orderNo) {
        return this.updateOrder(orderNo, { status: 'Rejected' });
    },

    createOrder(orderData) {
        const db = loadDb();
        const company = currentCompany(db);
        const orderNo = `M2026${String(db.orders.length + 1).padStart(5, '0')}`;
        const amount = Number(orderData.amount || orderData.items?.reduce((sum, item) => sum + Number(item.qty || item.quantity || 0) * Number(item.price || 0), 0) || 0);
        const order = {
            id: nextId(db.orders),
            orderNo,
            order_no: orderNo,
            company_id: company.id,
            customer: company.name,
            requisition: orderData.requisition || `PO-${Date.now().toString().slice(-6)}`,
            requisition_no: orderData.requisition || `PO-${Date.now().toString().slice(-6)}`,
            poDate: today,
            po_date: today,
            destination: orderData.destination || 'Demo Destination',
            amount,
            net_amount: amount,
            status: 'Pending',
            order_status: 'PENDING',
            paymentStatus: 'Unpaid',
            trackingNo: ''
        };
        db.orders.unshift(order);
        db.orderItems[orderNo] = (orderData.items || []).map(item => ({
            itemName: item.name || item.itemName,
            quantity: Number(item.qty || item.quantity || 0),
            price: Number(item.price || 0),
            size: item.size,
            uom: item.uom
        }));
        saveDb(db);
        return { success: true, orderNo, order };
    },

    getMaster(entity, search = '') {
        const db = loadDb();
        const name = collectionName(entity);
        return filterByText(db[name] || [], search, [
            'name',
            'item_name',
            'itemCode',
            'item_code',
            'category',
            'description',
            'primaryGroupName',
            'subGroupName',
            'size',
            'uom',
            'chapter_heading_no'
        ]);
    },

    saveMaster(entity, data, id) {
        const db = loadDb();
        const name = collectionName(entity);
        const rows = db[name] || [];
        const next = { ...data, id: id || data.id || nextId(rows) };
        if (entity === 'shipping-carriers') next.method_name = next.name || next.method_name;
        if (entity === 'primary-groups') next.group_name = next.name || next.group_name;
        if (entity === 'sub-groups') next.sub_group_name = next.name || next.sub_group_name;
        if (entity === 'units') next.unit_name = next.name || next.unit_name;
        if (entity === 'sizes') next.size_code = next.name || next.size_code;
        if (entity === 'products') {
            const primaryGroup = db.primaryGroups.find(group => String(group.id) === String(next.primary_group_id));
            const subGroup = db.subGroups.find(group => String(group.id) === String(next.sub_group_id));
            const size = db.sizes.find(item => String(item.id) === String(next.item_size_id));
            const unit = db.units.find(item => String(item.id) === String(next.unit_id));
            next.name = next.name || next.item_name;
            next.item_name = next.name;
            next.itemCode = next.itemCode || next.item_code || `ITEM-${next.id}`;
            next.item_code = next.itemCode;
            next.primaryGroupName = primaryGroup?.name || primaryGroup?.group_name || next.primaryGroupName || '';
            next.subGroupName = subGroup?.name || subGroup?.sub_group_name || next.subGroupName || '';
            next.size = size?.name || size?.size_code || next.size || '';
            next.uom = unit?.name || unit?.unit_name || next.uom || '';
            next.category = next.primaryGroupName || next.category || 'Marketplace Item';
            next.description = next.description || next.specifications || next.subGroupName || '';
            next.specifications = next.specifications || next.description;
            next.rate = Number(next.rate || next.list_price || 0);
            next.list_price = next.rate;
            next.mrp = Number(next.mrp || next.rate || 0);
            next.imageUrl = next.imageUrl || 'https://via.placeholder.com/300x200?text=Demo+Item';
        }
        const index = rows.findIndex(row => String(row.id) === String(next.id));
        if (index >= 0) rows[index] = next;
        else rows.push(next);
        db[name] = rows;
        saveDb(db);
        return { success: true, item: next };
    },

    deleteMaster(entity, id) {
        const db = loadDb();
        const name = collectionName(entity);
        db[name] = (db[name] || []).filter(row => String(row.id) !== String(id));
        saveDb(db);
        return { success: true };
    },

    getSupplies(filters = {}) {
        let rows = loadDb().supplies;
        const user = JSON.parse(localStorage.getItem('maco_user') || 'null');
        if (user?.role === 'customer') rows = rows.filter(row => row.companyId === user.companyIdCode);
        if (filters.companyId) rows = rows.filter(row => row.companyId === filters.companyId);
        if (filters.fromDate) rows = rows.filter(row => row.challanDate >= filters.fromDate);
        if (filters.toDate) rows = rows.filter(row => row.challanDate <= filters.toDate);
        return rows;
    },

    uploadChallan(challanData) {
        const db = loadDb();
        const order = db.orders.find(item => item.orderNo === challanData.orderNo);
        if (!order) return { success: false, message: 'Order not found.' };
        const company = db.companies.find(item => Number(item.id) === Number(order.company_id));
        const carrier = db.shippingCarriers.find(item => String(item.id) === String(challanData.carrierId));
        const challanNo = challanData.challanNo || `CH-${Date.now().toString().slice(-5)}`;
        const supply = {
            id: nextId(db.supplies),
            challanNo,
            challan_no: challanNo,
            orderNo: order.orderNo,
            order_no: order.orderNo,
            companyId: company?.companyId,
            companyName: company?.name,
            carrierId: carrier?.id,
            carrierName: carrier?.name,
            challanDate: challanData.challanDate || today,
            challan_date: challanData.challanDate || today,
            quantity: (db.orderItems[order.orderNo] || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
            supplyDetails: challanData.supplyDetails || 'Demo dispatch created.'
        };
        db.supplies.unshift(supply);
        order.status = 'Dispatched';
        order.order_status = 'DISPATCHED';
        order.trackingNo = challanNo;
        saveDb(db);
        return { success: true, challan: supply };
    },

    getLeads() {
        return loadDb().leads;
    },

    createLead(data) {
        const db = loadDb();
        db.leads.unshift({ ...data, id: nextId(db.leads), status: data.status || 'New', createdAt: today });
        saveDb(db);
        return { success: true };
    },

    convertLead(id, data) {
        const db = loadDb();
        const lead = db.leads.find(item => String(item.id) === String(id));
        if (lead) lead.status = 'Converted';
        db.deals.unshift({
            id: nextId(db.deals),
            name: data.dealName || `Deal for ${lead?.name || 'Lead'}`,
            amount: Number(data.amount || 0),
            stage: 'Discovery',
            leadId: Number(id),
            createdAt: today
        });
        saveDb(db);
        return { success: true };
    },

    getDeals() {
        return loadDb().deals;
    },

    createDeal(data) {
        const db = loadDb();
        db.deals.unshift({ ...data, id: nextId(db.deals), amount: Number(data.amount || 0), stage: data.stage || 'Discovery', createdAt: today });
        saveDb(db);
        return { success: true };
    },

    getTasks() {
        return loadDb().tasks;
    },

    createTask(data) {
        const db = loadDb();
        db.tasks.unshift({ ...data, id: nextId(db.tasks), status: data.status || 'Pending' });
        saveDb(db);
        return { success: true };
    },

    getReports() {
        const db = loadDb();
        const salesData = [
            { month: '2026-02', orderCount: 8, totalRevenue: 182000 },
            { month: '2026-03', orderCount: 11, totalRevenue: 246000 },
            { month: '2026-04', orderCount: 9, totalRevenue: 198500 },
            { month: '2026-05', orderCount: 13, totalRevenue: 312400 },
            { month: '2026-06', orderCount: 15, totalRevenue: 386200 },
            {
                month: '2026-07',
                orderCount: db.orders.length,
                totalRevenue: db.orders.reduce((sum, order) => sum + Number(order.amount || 0), 0)
            }
        ];
        const supplyData = [
            { month: '2026-02', challanCount: 5 },
            { month: '2026-03', challanCount: 7 },
            { month: '2026-04', challanCount: 6 },
            { month: '2026-05', challanCount: 9 },
            { month: '2026-06', challanCount: 12 },
            { month: '2026-07', challanCount: db.supplies.length }
        ];
        return { salesData, supplyData };
    },

    downloadExport(type) {
        const db = loadDb();
        const rows = type === 'catalog' ? db.products : type === 'orders' ? db.orders : db.supplies;
        const headers = Object.keys(rows[0] || { demo: 'No data' });
        const csv = [
            headers.join(','),
            ...rows.map(row => headers.map(header => JSON.stringify(row[header] ?? '')).join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `maco_${type}_${today}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    }
};
