import React, { useState } from 'react';
import MasterDataPage from '../../components/MasterDataPage';
import { useMasterDataController } from '../../../controllers/MasterDataController';

export default function ManageItemSize() {
    const { data: sizes, loading, handleSave, handleDelete } = useMasterDataController('Sizes');
    const [name, setName] = useState('');

    const onSave = async (e) => {
        e.preventDefault();
        const res = await handleSave({ name });
        if (res.success) setName('');
        else alert(res.message);
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Size Name' }
    ];

    return (
        <MasterDataPage
            title="Item Size"
            description="Create reusable size values for products that need size-wise ordering or stock control."
            formTitle="Add Size"
            formHint="Use the same naming format everywhere for cleaner reports."
            onSubmit={onSave}
            primaryAction="Save Size"
            tableTitle="Existing Sizes"
            tableHint="Available size values can be used throughout item setup."
            columns={columns}
            data={sizes}
            loading={loading}
            actions={['Delete']}
            onAction={(action, row) => action === 'Delete' && handleDelete(row.id)}
            stats={[{ label: 'Required Fields', value: '1' }]}
        >
            <div className="form-group">
                <label className="required-label">Item Size <span className="required">*</span></label>
                <input
                    type="text"
                    className="login-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Example: Medium"
                    required
                />
            </div>
        </MasterDataPage>
    );
}
