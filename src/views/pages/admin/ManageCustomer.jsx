import React, { useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { useCustomerController } from '../../../controllers/CustomerController';

const initialFormData = {
    id: '',
    companyId: '',
    name: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    contact: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    pincode: '',
    pan_no: '',
    gstin_no: '',
    registration_no: '',
    tin_no: '',
    role_master: 'CUSTOMER',
    isActive: true
};

const textFields = [
    ['companyId', 'Customer Id', 'M10001', true],
    ['name', 'Customer Name', 'Enter customer name', true],
    ['username', 'Username', 'Login username', false],
    ['password', 'Password', 'Leave blank while editing', false, 'password'],
    ['first_name', 'First Name', 'Contact first name'],
    ['last_name', 'Last Name', 'Contact last name'],
    ['email', 'Email ID', 'accounts@customer.com', true, 'email'],
    ['contact', 'Contact No', '9876543210'],
    ['address_1', 'Address 1', 'Registered address'],
    ['address_2', 'Address 2', 'Optional address'],
    ['city', 'City', 'New Delhi'],
    ['state', 'State', 'Delhi'],
    ['pincode', 'Pincode', '110001'],
    ['pan_no', 'PAN No', 'ABCDE1234F'],
    ['gstin_no', 'GSTIN No', 'GSTIN number'],
    ['registration_no', 'Registration No', 'Customer registration']
];

export default function ManageCustomer() {
    const { customers, loading, fetchCustomers, handleSaveCustomer, handleDeleteCustomer } = useCustomerController();
    const [formData, setFormData] = useState(initialFormData);
    const [search, setSearch] = useState('');
    const [sameAsAddress1, setSameAsAddress1] = useState(false);

    const activeCustomers = customers.filter(customer => customer.isActive).length;
    const inactiveCustomers = customers.length - activeCustomers;
    const isEditing = Boolean(formData.id);

    const columns = useMemo(() => [
        { key: 'companyId', header: 'Customer Id' },
        { key: 'name', header: 'Customer Name' },
        { key: 'username', header: 'Username' },
        { key: 'email', header: 'Email ID' },
        { key: 'contact', header: 'Contact No' },
        { key: 'city', header: 'City' },
        { key: 'pan_no', header: 'PAN' },
        {
            key: 'isActive',
            header: 'Status',
            render: (row) => (
                <span className={`customer-status-badge ${row.isActive ? 'is-active' : 'is-inactive'}`}>
                    {row.isActive ? 'Active' : 'Inactive'}
                </span>
            )
        }
    ], []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            ...(name === 'address_1' && sameAsAddress1 ? { address_2: value } : {})
        }));
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setSameAsAddress1(false);
    };

    const handleSameAddressToggle = (e) => {
        const checked = e.target.checked;
        setSameAsAddress1(checked);
        if (checked) {
            setFormData(prev => ({ ...prev, address_2: prev.address_1 }));
        }
    };

    const submitCustomer = async () => {
        const saved = await handleSaveCustomer({
            ...formData,
            username: formData.username || formData.companyId
        });
        if (saved) resetForm();
    };

    const onSubmit = (e) => {
        e.preventDefault();
        submitCustomer();
    };

    const onSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        fetchCustomers(true, value);
    };

    const onAction = (action, row) => {
        if (action === 'Edit') {
            setFormData({
                ...initialFormData,
                ...row,
                companyId: row.companyId || row.company_id_code || '',
                name: row.name || row.company_name || '',
                contact: row.contact || row.contact_no || '',
                password: ''
            });
            setSameAsAddress1(false);
        }
        if (action === 'Delete') {
            handleDeleteCustomer(row.id);
        }
    };

    return (
        <div className="manage-customer-page">
            <PageHeader title="Manage Customer Section" />
            <div className="manage-customer-shell">
                <div className="customer-summary-grid">
                    <div className="customer-summary-card">
                        <span className="summary-label">Total Customers</span>
                        <strong>{customers.length}</strong>
                    </div>
                    <div className="customer-summary-card tone-success">
                        <span className="summary-label">Active Accounts</span>
                        <strong>{activeCustomers}</strong>
                    </div>
                    <div className="customer-summary-card tone-muted">
                        <span className="summary-label">Inactive Accounts</span>
                        <strong>{inactiveCustomers}</strong>
                    </div>
                </div>

                <section className="customer-panel">
                    <div className="customer-panel-header">
                        <div>
                            <span className="customer-panel-kicker">Administration</span>
                            <h2>{isEditing ? 'Update Customer Account' : 'Manage Customer Account'}</h2>
                        </div>
                        <span className="customer-panel-status">Customer Master</span>
                    </div>

                    <form id="customer-form" className="customer-form" onSubmit={onSubmit}>
                        <div className="customer-form-grid">
                            {textFields.map(([name, label, placeholder, required, type = 'text']) => {
                                const isAddress2 = name === 'address_2';

                                return (
                                    <div className="customer-field" key={name}>
                                        <label htmlFor={name}>{label} {required && <span>*</span>}</label>
                                        <input
                                            id={name}
                                            name={name}
                                            type={type}
                                            required={Boolean(required)}
                                            value={formData[name]}
                                            onChange={handleChange}
                                            placeholder={placeholder}
                                            readOnly={isAddress2 && sameAsAddress1}
                                        />
                                        {isAddress2 && (
                                            <label className="customer-address-copy" htmlFor="sameAsAddress1">
                                                <input
                                                    id="sameAsAddress1"
                                                    type="checkbox"
                                                    checked={sameAsAddress1}
                                                    onChange={handleSameAddressToggle}
                                                />
                                                <span>Same as Address 1</span>
                                            </label>
                                        )}
                                    </div>
                                );
                            })}
                            <div className="customer-field">
                                <label htmlFor="role_master">Role</label>
                                <select id="role_master" name="role_master" value={formData.role_master} onChange={handleChange}>
                                    <option value="CUSTOMER">Customer</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="customer-form-actions">
                            <label className="customer-toggle" htmlFor="isActive">
                                <input name="isActive" type="checkbox" id="isActive" checked={formData.isActive} onChange={handleChange} />
                                <span>Is Active</span>
                            </label>
                            <div className="btn-group">
                                <button type="submit" className="btn btn-primary">{isEditing ? 'Update' : 'Save'}</button>
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>Reset</button>
                            </div>
                        </div>
                    </form>
                </section>

                <section className="customer-panel customer-table-panel">
                    <div className="customer-panel-header">
                        <div>
                            <span className="customer-panel-kicker">Directory</span>
                            <h2>Customer Data</h2>
                        </div>
                        <span className="customer-record-count">{customers.length} Records</span>
                    </div>

                    <div className="customer-search-row">
                        <input
                            type="search"
                            value={search}
                            onChange={onSearch}
                            placeholder="Search customer, username, city, PAN, TIN"
                        />
                    </div>

                    {loading ? (
                        <div className="customer-loading-state">Loading customers...</div>
                    ) : (
                        <DataTable columns={columns} data={customers} actions={['Edit', 'Delete']} onAction={onAction} />
                    )}
                </section>
            </div>
        </div>
    );
}
