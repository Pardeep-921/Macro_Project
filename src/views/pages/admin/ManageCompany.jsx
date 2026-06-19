import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import FormButtons from '../../components/FormButtons';
import DataTable from '../../components/DataTable';
import { useCompanyController } from '../../../controllers/CompanyController';

const initialFormData = {
    companyId: '',
    name: '',
    email: '',
    contact: '',
    isActive: true
};

export default function ManageCompany() {
    const { companies, loading, handleSaveCompany } = useCompanyController();

    const [formData, setFormData] = useState(initialFormData);

    const activeCompanies = companies.filter(company => company.isActive).length;
    const inactiveCompanies = companies.length - activeCompanies;

    const columns = [
        { key: 'companyId', header: 'Company Id' },
        { key: 'name', header: 'Company Name' },
        { key: 'email', header: 'Email ID' },
        { key: 'contact', header: 'Contact No' },
        {
            key: 'isActive',
            header: 'Status',
            render: (row) => (
                <span className={`company-status-badge ${row.isActive ? 'is-active' : 'is-inactive'}`}>
                    {row.isActive ? 'Active' : 'Inactive'}
                </span>
            )
        }
    ];

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
        const saved = await handleSaveCompany(formData);
        if (saved) resetForm();
    };

    const onSubmit = (e) => {
        e.preventDefault();
        submitCompany();
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
                            <h2>Manage Company Account</h2>
                        </div>
                        <span className="company-panel-status">Company Master</span>
                    </div>

                    <form id="company-form" className="company-form" onSubmit={onSubmit}>
                        <div className="company-form-grid">
                            <div className="company-field">
                                <label htmlFor="companyId">Company Id <span>*</span></label>
                                <input id="companyId" name="companyId" type="text" required value={formData.companyId} onChange={handleChange} placeholder="CO1001" />
                            </div>
                            <div className="company-field">
                                <label htmlFor="name">Company Name</label>
                                <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Enter company name" />
                            </div>
                            <div className="company-field">
                                <label htmlFor="email">Email ID <span>*</span></label>
                                <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="accounts@company.com" />
                            </div>
                            <div className="company-field">
                                <label htmlFor="contact">Contact No <span>*</span></label>
                                <input id="contact" name="contact" type="text" required value={formData.contact} onChange={handleChange} placeholder="9876543210" />
                            </div>
                        </div>

                        <div className="company-form-actions">
                            <label className="company-toggle" htmlFor="isActive">
                                <input name="isActive" type="checkbox" id="isActive" checked={formData.isActive} onChange={handleChange} />
                                <span>Is Active</span>
                            </label>
                            <FormButtons
                                saveType="submit"
                                onUpdate={() => {}}
                                onReset={resetForm}
                            />
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

                    {loading ? (
                        <div className="company-loading-state">Loading companies...</div>
                    ) : (
                        <DataTable columns={columns} data={companies} actions={[]} onAction={() => {}} />
                    )}
                </section>
            </div>
        </div>
    );
}
