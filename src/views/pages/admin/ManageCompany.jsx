import React, { useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { useCompanyController } from '../../../controllers/CompanyController';

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
    fax: '',
    ecc_no: '',
    services_tax_no: '',
    pan_no: '',
    registration_no: '',
    tin_no: '',
    cst_no: '',
    role_master: 'CUSTOMER',
    isActive: true
};

const textFields = [
    ['companyId', 'Company Id', 'M10001', true],
    ['name', 'Company Name', 'Enter company name', true],
    ['username', 'Username', 'Login username', false],
    ['password', 'Password', 'Leave blank while editing', false, 'password'],
    ['first_name', 'First Name', 'Contact first name'],
    ['last_name', 'Last Name', 'Contact last name'],
    ['email', 'Email ID', 'accounts@company.com', true, 'email'],
    ['contact', 'Contact No', '9876543210'],
    ['address_1', 'Address 1', 'Registered address'],
    ['address_2', 'Address 2', 'Optional address'],
    ['city', 'City', 'New Delhi'],
    ['state', 'State', 'Delhi'],
    ['pincode', 'Pincode', '110001'],
    ['fax', 'Fax', 'Fax number'],
    ['pan_no', 'PAN No', 'ABCDE1234F'],
    ['ecc_no', 'ECC No', 'ECC registration'],
    ['tin_no', 'TIN No', 'TIN number'],
    ['cst_no', 'CST No', 'CST number'],
    ['services_tax_no', 'Service Tax No', 'Service tax number'],
    ['registration_no', 'Registration No', 'Company registration']
];

export default function ManageCompany() {
    const { companies, loading, fetchCompanies, handleSaveCompany, handleDeleteCompany } = useCompanyController();
    const [formData, setFormData] = useState(initialFormData);
    const [search, setSearch] = useState('');

    const activeCompanies = companies.filter(company => company.isActive).length;
    const inactiveCompanies = companies.length - activeCompanies;
    const isEditing = Boolean(formData.id);

    const columns = useMemo(() => [
        { key: 'companyId', header: 'Company Id' },
        { key: 'name', header: 'Company Name' },
        { key: 'username', header: 'Username' },
        { key: 'email', header: 'Email ID' },
        { key: 'contact', header: 'Contact No' },
        { key: 'city', header: 'City' },
        { key: 'pan_no', header: 'PAN' },
        {
            key: 'isActive',
            header: 'Status',
            render: (row) => (
                <span className={`company-status-badge ${row.isActive ? 'is-active' : 'is-inactive'}`}>
                    {row.isActive ? 'Active' : 'Inactive'}
                </span>
            )
        }
    ], []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetForm = () => {
        setFormData(initialFormData);
    };

    const submitCompany = async () => {
        const saved = await handleSaveCompany({
            ...formData,
            username: formData.username || formData.companyId
        });
        if (saved) resetForm();
    };

    const onSubmit = (e) => {
        e.preventDefault();
        submitCompany();
    };

    const onSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        fetchCompanies(true, value);
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
        }
        if (action === 'Delete') {
            handleDeleteCompany(row.id);
        }
    };

    return (
        <div className="manage-company-page">
            <PageHeader title="Manage Company Section" />
            <div className="manage-company-shell">
                <div className="company-summary-grid">
                    <div className="company-summary-card">
                        <span className="summary-label">Total Companies</span>
                        <strong>{companies.length}</strong>
                    </div>
                    <div className="company-summary-card tone-success">
                        <span className="summary-label">Active Accounts</span>
                        <strong>{activeCompanies}</strong>
                    </div>
                    <div className="company-summary-card tone-muted">
                        <span className="summary-label">Inactive Accounts</span>
                        <strong>{inactiveCompanies}</strong>
                    </div>
                </div>

                <section className="company-panel">
                    <div className="company-panel-header">
                        <div>
                            <span className="company-panel-kicker">Administration</span>
                            <h2>{isEditing ? 'Update Company Account' : 'Manage Company Account'}</h2>
                        </div>
                        <span className="company-panel-status">Company Master</span>
                    </div>

                    <form id="company-form" className="company-form" onSubmit={onSubmit}>
                        <div className="company-form-grid">
                            {textFields.map(([name, label, placeholder, required, type = 'text']) => (
                                <div className="company-field" key={name}>
                                    <label htmlFor={name}>{label} {required && <span>*</span>}</label>
                                    <input
                                        id={name}
                                        name={name}
                                        type={type}
                                        required={Boolean(required)}
                                        value={formData[name]}
                                        onChange={handleChange}
                                        placeholder={placeholder}
                                    />
                                </div>
                            ))}
                            <div className="company-field">
                                <label htmlFor="role_master">Role</label>
                                <select id="role_master" name="role_master" value={formData.role_master} onChange={handleChange}>
                                    <option value="CUSTOMER">Customer</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="company-form-actions">
                            <label className="company-toggle" htmlFor="isActive">
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

                <section className="company-panel company-table-panel">
                    <div className="company-panel-header">
                        <div>
                            <span className="company-panel-kicker">Directory</span>
                            <h2>Company Data</h2>
                        </div>
                        <span className="company-record-count">{companies.length} Records</span>
                    </div>

                    <div className="company-search-row">
                        <input
                            type="search"
                            value={search}
                            onChange={onSearch}
                            placeholder="Search company, username, city, PAN, TIN"
                        />
                    </div>

                    {loading ? (
                        <div className="company-loading-state">Loading companies...</div>
                    ) : (
                        <DataTable columns={columns} data={companies} actions={['Edit', 'Delete']} onAction={onAction} />
                    )}
                </section>
            </div>
        </div>
    );
}
