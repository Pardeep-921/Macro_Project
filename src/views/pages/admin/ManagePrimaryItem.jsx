import React, { useState } from 'react';
import MasterDataPage from '../../components/MasterDataPage';
import { useMasterDataController } from '../../../controllers/MasterDataController';

export default function ManagePrimaryItem() {
    // Note: We use 'PrimaryItems' as the key, though it requires a backend endpoint.
    // I'll ensure the backend has /api/primary-items.
    const { data: items, loading, handleSave, handleDelete } = useMasterDataController('PrimaryItems');
    const [formData, setFormData] = useState({ name: '', desc: '' });

    const onSave = async (e) => {
        e.preventDefault();
        const res = await handleSave(formData);
        if (res.success) setFormData({ name: '', desc: '' });
        else alert(res.message);
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Group Name' },
        { key: 'desc', header: 'Description' }
    ];

    return (
        <MasterDataPage
            title="Primary Item Master"
            description="Maintain the top-level product groups used across item creation, cataloging, and reporting."
            formTitle="Add Primary Group"
            formHint="Create a clear parent group before mapping sub groups and items."
            onSubmit={onSave}
            primaryAction="Save Primary Group"
            tableTitle="Existing Primary Groups"
            tableHint="Primary groups define the first level of the item hierarchy."
            columns={columns}
            data={items}
            loading={loading}
            actions={['Delete']}
            onAction={(action, row) => action === 'Delete' && handleDelete(row.id)}
            stats={[{ label: 'Required Fields', value: '1' }]}
        >
            <div className="form-group">
                <label className="required-label">Primary Group Name <span className="required">*</span></label>
                <input
                    type="text"
                    className="login-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Example: Bags"
                    required
                />
            </div>
            <div className="form-group full-width">
                <label>Description</label>
                <textarea
                    className="login-input"
                    value={formData.desc}
                    onChange={e => setFormData({ ...formData, desc: e.target.value })}
                    placeholder="Optional notes for this product group"
                />
            </div>
        </MasterDataPage>
    );
}
