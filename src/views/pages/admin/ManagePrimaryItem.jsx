import React, { useState } from 'react';
import MasterDataPage from '../../components/MasterDataPage';
import { useMasterDataController } from '../../../controllers/MasterDataController';

const initialFormData = { id: '', name: '', desc: '' };

export default function ManagePrimaryItem() {
    const { data: items, loading, handleSave, handleDelete, refresh } = useMasterDataController('PrimaryGroups');
    const [formData, setFormData] = useState(initialFormData);
    const [search, setSearch] = useState('');

    const onSave = async (e) => {
        e.preventDefault();
        const res = await handleSave(formData);
        if (res.success) setFormData(initialFormData);
        else alert(res.message);
    };

    const onSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        refresh(value);
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
            formTitle={formData.id ? 'Update Primary Group' : 'Add Primary Group'}
            formHint="Create a clear parent group before mapping sub groups and items."
            onSubmit={onSave}
            primaryAction={formData.id ? 'Update Primary Group' : 'Save Primary Group'}
            secondaryAction={formData.id ? { label: 'Cancel Edit', onClick: () => setFormData(initialFormData) } : null}
            tableTitle="Existing Primary Groups"
            tableHint="Primary groups define the first level of the item hierarchy."
            columns={columns}
            data={items}
            loading={loading}
            actions={['Edit', 'Delete']}
            onAction={(action, row) => {
                if (action === 'Edit') setFormData({ id: row.id, name: row.name, desc: row.desc || '' });
                if (action === 'Delete') handleDelete(row.id);
            }}
            stats={[{ label: 'Required Fields', value: '1' }]}
        >
            <div className="form-group">
                <label className="required-label">Primary Group Name <span className="required">*</span></label>
                <input
                    type="text"
                    className="login-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Example: Piston Pins"
                    required
                />
            </div>
            <div className="form-group">
                <label>Search Groups</label>
                <input
                    type="search"
                    className="login-input"
                    value={search}
                    onChange={onSearch}
                    placeholder="Search primary groups"
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
