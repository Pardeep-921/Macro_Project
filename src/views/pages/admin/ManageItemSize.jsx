import React, { useState } from 'react';
import MasterDataPage from '../../components/MasterDataPage';
import { useMasterDataController } from '../../../controllers/MasterDataController';

export default function ManageItemSize() {
    const { data: sizes, loading, handleSave, handleDelete } = useMasterDataController('Sizes');
    const [formData, setFormData] = useState({ id: '', name: '', description: '' });

    const onSave = async (e) => {
        e.preventDefault();
        const res = await handleSave(formData);
        if (res.success) setFormData({ id: '', name: '', description: '' });
        else alert(res.message);
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Size Code' },
        { key: 'description', header: 'Description' }
    ];

    return (
        <MasterDataPage
            title="Item Size"
            description="Create reusable size values for products that need size-wise ordering or stock control."
            formTitle={formData.id ? 'Update Size' : 'Add Size'}
            formHint="Use compact size codes such as STD, 001, or 002 for cleaner reports."
            onSubmit={onSave}
            primaryAction={formData.id ? 'Update Size' : 'Save Size'}
            secondaryAction={formData.id ? { label: 'Cancel Edit', onClick: () => setFormData({ id: '', name: '', description: '' }) } : null}
            tableTitle="Existing Sizes"
            tableHint="Available size values can be used throughout item setup."
            columns={columns}
            data={sizes}
            loading={loading}
            actions={['Edit', 'Delete']}
            onAction={(action, row) => {
                if (action === 'Edit') setFormData({ id: row.id, name: row.name, description: row.description || '' });
                if (action === 'Delete') handleDelete(row.id);
            }}
            stats={[{ label: 'Required Fields', value: '1' }]}
        >
            <div className="form-group">
                <label className="required-label">Item Size Code <span className="required">*</span></label>
                <input
                    type="text"
                    className="login-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Example: STD"
                    required
                />
            </div>
            <div className="form-group">
                <label>Description</label>
                <input
                    type="text"
                    className="login-input"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Example: Standard size"
                />
            </div>
        </MasterDataPage>
    );
}
