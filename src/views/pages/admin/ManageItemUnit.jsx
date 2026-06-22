import React, { useState } from 'react';
import MasterDataPage from '../../components/MasterDataPage';
import { useMasterDataController } from '../../../controllers/MasterDataController';

export default function ManageItemUnit() {
    const { data: units, loading, handleSave, handleDelete } = useMasterDataController('Units');
    const [formData, setFormData] = useState({ id: '', name: '', description: '' });

    const onSave = async (e) => {
        e.preventDefault();
        const res = await handleSave(formData);
        if (res.success) setFormData({ id: '', name: '', description: '' });
        else alert(res.message);
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Unit Name' },
        { key: 'description', header: 'Description' }
    ];

    return (
        <MasterDataPage
            title="Item Unit"
            description="Maintain unit of measure values used for product quantity, stock, and pricing."
            formTitle={formData.id ? 'Update Unit' : 'Add Unit'}
            formHint="Keep unit names concise, such as PCS, BOX, SET, or MTR."
            onSubmit={onSave}
            primaryAction={formData.id ? 'Update Unit' : 'Save Unit'}
            secondaryAction={formData.id ? { label: 'Cancel Edit', onClick: () => setFormData({ id: '', name: '', description: '' }) } : null}
            tableTitle="Existing Units"
            tableHint="Units listed here appear in item master selection."
            columns={columns}
            data={units}
            loading={loading}
            actions={['Edit', 'Delete']}
            onAction={(action, row) => {
                if (action === 'Edit') setFormData({ id: row.id, name: row.name, description: row.description || '' });
                if (action === 'Delete') handleDelete(row.id);
            }}
            stats={[{ label: 'Used In', value: 'Items' }]}
        >
            <div className="form-group">
                <label className="required-label">Item Unit Name <span className="required">*</span></label>
                <input
                    type="text"
                    className="login-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Example: PCS"
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
                    placeholder="Example: Pieces"
                />
            </div>
        </MasterDataPage>
    );
}
