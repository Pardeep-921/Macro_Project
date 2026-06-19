// src/views/pages/admin/ManageLeads.jsx
import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { useCRMController } from '../../../controllers/CRMController';

export default function ManageLeads() {
    const { leads, loading, handleCreateLead, handleConvertLead } = useCRMController();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', status: 'New' });
    const [convertId, setConvertId] = useState(null);
    const [conversionData, setConversionData] = useState({ dealName: '', amount: '' });
    const activeLeads = leads.filter(l => l.status !== 'Converted');
    const convertedLeads = leads.filter(l => l.status === 'Converted').length;

    const columns = [
        { key: 'name', header: 'Lead Name' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Phone' },
        { key: 'status', header: 'Status' },
        { key: 'createdAt', header: 'Date Added' }
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const res = await handleCreateLead(formData);
        if (res.success) {
            setFormData({ name: '', email: '', phone: '', status: 'New' });
            alert('Lead created successfully');
        } else {
            alert(res.message);
        }
    };

    const onAction = (action, row) => {
        if (action === 'Convert') {
            setConvertId(row.id);
            setConversionData({ dealName: `Deal for ${row.name}`, amount: '0' });
        }
    };

    const handleConvertSubmit = async (e) => {
        e.preventDefault();
        const res = await handleConvertLead(convertId, conversionData);
        if (res.success) {
            setConvertId(null);
            alert('Lead converted to Deal!');
        } else {
            alert(res.message);
        }
    };

    return (
        <div className="crm-page">
            <PageHeader title="Lead Management" />
            <div className="crm-shell">
                <div className="crm-summary-grid">
                    <article className="crm-summary-card tone-orange">
                        <span>Total Leads</span>
                        <strong>{leads.length}</strong>
                    </article>
                    <article className="crm-summary-card tone-info">
                        <span>Active Leads</span>
                        <strong>{activeLeads.length}</strong>
                    </article>
                    <article className="crm-summary-card tone-success">
                        <span>Converted</span>
                        <strong>{convertedLeads}</strong>
                    </article>
                </div>

                <section className="crm-panel">
                    <div className="crm-panel-heading">
                        <div>
                            <span className="crm-kicker">Lead Entry</span>
                            <h2>Add New Lead</h2>
                        </div>
                    </div>
                    <form className="crm-form" onSubmit={onSubmit}>
                        <div className="form-grid crm-form-grid">
                            <div className="form-group">
                                <label className="required-label">Lead Name <span className="required">*</span></label>
                                <input name="name" type="text" className="responsive-input" required value={formData.name} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input name="email" type="email" className="responsive-input" value={formData.email} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input name="phone" type="text" className="responsive-input" value={formData.phone} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" className="responsive-input" value={formData.status} onChange={handleChange}>
                                    <option value="New">New</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Lost">Lost</option>
                                </select>
                            </div>
                        </div>
                        <div className="crm-actions">
                            <button type="submit" className="btn btn-primary">Save Lead</button>
                        </div>
                    </form>
                </section>

                {convertId && (
                    <section className="crm-panel crm-conversion-panel">
                        <div className="crm-panel-heading">
                            <div>
                                <span className="crm-kicker">Pipeline</span>
                                <h2>Convert Lead to Deal</h2>
                            </div>
                        </div>
                        <form className="crm-form" onSubmit={handleConvertSubmit}>
                            <div className="form-grid crm-form-grid">
                                <div className="form-group">
                                    <label>Deal Name</label>
                                    <input type="text" value={conversionData.dealName} onChange={e => setConversionData({...conversionData, dealName: e.target.value})} required className="responsive-input" />
                                </div>
                                <div className="form-group">
                                    <label>Expected Amount</label>
                                    <input type="number" value={conversionData.amount} onChange={e => setConversionData({...conversionData, amount: e.target.value})} required className="responsive-input" />
                                </div>
                            </div>
                            <div className="crm-actions">
                                <button type="submit" className="btn btn-primary">Proceed Conversion</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setConvertId(null)}>Cancel</button>
                            </div>
                        </form>
                    </section>
                )}

                <section className="crm-panel crm-table-panel">
                    <div className="crm-panel-heading">
                        <div>
                            <span className="crm-kicker">Lead List</span>
                            <h2>Active Leads</h2>
                        </div>
                        <span className="crm-count">{activeLeads.length} Records</span>
                    </div>
                    {loading ? <div className="crm-loading">Loading leads...</div> : (
                        <div className="crm-table-scroll">
                            <DataTable 
                                columns={columns} 
                                data={activeLeads} 
                                actions={['Convert']} 
                                onAction={onAction} 
                            />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
