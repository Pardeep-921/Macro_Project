import React, { useState } from 'react';
import MasterDataPage from '../../components/MasterDataPage';
import DataTable from '../../components/DataTable';
import { useMasterDataController } from '../../../controllers/MasterDataController';
import { staticProducts } from '../../../data/marketplaceProducts';

const initialFormData = {
    id: '',
    name: '',
    primary_group_id: ''
};

export default function ManageSubGroupItem() {
    const { data: subGroups, loading, handleSave, handleDelete, refresh } = useMasterDataController('SubGroups');
    const { data: primaryGroups, loading: primaryLoading } = useMasterDataController('PrimaryGroups');
    const [formData, setFormData] = useState(initialFormData);
    const [search, setSearch] = useState('');
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [editingCompany, setEditingCompany] = useState(null);

    const allPrimaryGroups = React.useMemo(() => {
        const dynamicIds = new Set(primaryGroups.map(item => String(item.id)));
        return [...primaryGroups, ...staticProducts.filter(item => !dynamicIds.has(String(item.id)))];
    }, [primaryGroups]);

    const onSave = async (e) => {
        e.preventDefault();
        const res = await handleSave(formData);
        if (res.success) setFormData(initialFormData);
        else alert(res.message);
    };

    const onEditSave = async (e) => {
        e.preventDefault();
        if (!editingCompany) return;
        const res = await handleSave(editingCompany);
        if (res.success) setEditingCompany(null);
        else alert(res.message);
    };

    const onSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        refresh(value);
    };

    const customTable = (
        <div className="grouped-companies" style={{ marginTop: '15px' }}>
            {allPrimaryGroups.map(pg => {
                const companies = subGroups.filter(sg => String(sg.primary_group_id) === String(pg.id));
                const isExpanded = expandedGroup === pg.id;

                return (
                    <div key={pg.id} className="group-accordion" style={{ marginBottom: '10px', border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                            className="group-header"
                            onClick={() => setExpandedGroup(isExpanded ? null : pg.id)}
                            style={{ padding: '15px', backgroundColor: '#f9f9f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <strong style={{ fontSize: '15px' }}>{pg.name}</strong>
                            <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
                                {companies.length} Companies {isExpanded ? '▼' : '▶'}
                            </span>
                        </div>
                        {isExpanded && (
                            <div className="group-content">
                                {companies.length > 0 ? (
                                    <DataTable
                                        columns={[
                                            { key: 'name', header: 'Company/Brand Name' }
                                        ]}
                                        data={companies}
                                        actions={['Edit', 'Delete']}
                                        onAction={(action, row) => {
                                            if (action === 'Edit') {
                                                setEditingCompany({
                                                    id: row.id,
                                                    name: row.name,
                                                    primary_group_id: row.primary_group_id || ''
                                                });
                                            }
                                            if (action === 'Delete') handleDelete(row.id);
                                        }}
                                    />
                                ) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                        No companies found under this primary group.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <>
            <MasterDataPage
                title="Company / Brand Master"
                description="Organize manufacturing companies or brands under primary groups to display on the price list pages."
                formTitle={formData.id ? 'Update Company' : 'Add Company'}
                formHint="Enter the company or brand details, then use search only when you need to filter existing records below."
                onSubmit={onSave}
                primaryAction={formData.id ? 'Update Company' : 'Save Company'}
                secondaryAction={formData.id ? { label: 'Cancel Edit', onClick: () => setFormData(initialFormData) } : null}
                tableTitle="Existing Companies"
                tableHint="Click on any primary group below to view the companies associated with it."
                customTable={customTable}
                loading={loading || primaryLoading}
                stats={[{ label: 'Primary Groups', value: allPrimaryGroups.length }]}
            >
                <div className="form-group">
                    <label className="required-label">Company / Brand Name <span className="required">*</span></label>
                    <input
                        type="text"
                        className="login-input"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter company or brand name (e.g. BAJAJ AUTO)"
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="required-label">Under Primary Group <span className="required">*</span></label>
                    <select
                        className="login-input"
                        value={formData.primary_group_id}
                        onChange={e => setFormData({ ...formData, primary_group_id: e.target.value })}
                        required
                    >
                        <option value="">--Select--</option>
                        {allPrimaryGroups.map(group => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                    </select>
                </div>
            </MasterDataPage>

            {editingCompany && (
                <div className="modal-overlay" onClick={() => setEditingCompany(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                        <button className="modal-close" onClick={() => setEditingCompany(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>&times;</button>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Edit Company / Brand</h2>
                        <form onSubmit={onEditSave}>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label className="required-label" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Company / Brand Name <span className="required" style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    className="login-input"
                                    value={editingCompany.name}
                                    onChange={e => setEditingCompany({ ...editingCompany, name: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '25px' }}>
                                <label className="required-label" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Under Primary Group <span className="required" style={{ color: 'red' }}>*</span></label>
                                <select
                                    className="login-input"
                                    value={editingCompany.primary_group_id}
                                    onChange={e => setEditingCompany({ ...editingCompany, primary_group_id: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                >
                                    <option value="">--Select--</option>
                                    {allPrimaryGroups.map(group => (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingCompany(null)} style={{ padding: '10px 20px', backgroundColor: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', backgroundColor: '#cc3333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
