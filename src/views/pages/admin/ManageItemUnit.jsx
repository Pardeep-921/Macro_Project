import React, { useState } from 'react';
import MasterDataPage from '../../components/MasterDataPage';
import { useMasterDataController } from '../../../controllers/MasterDataController';

export default function ManageItemUnit() {
    const { data: units, loading, handleSave, handleDelete } = useMasterDataController('Units');
    const [name, setName] = useState('');

    const onSave = async (e) => {
        e.preventDefault();
        const res = await handleSave({ name });
        if (res.success) setName('');
        else alert(res.message);
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Unit Name' }
    ];

    return (
        <MasterDataPage
            title="Item Unit"
            description="Maintain unit of measure values used for product quantity, stock, and pricing."
            formTitle="Add Unit"
            formHint="Keep unit names concise, such as PCS, BOX, SET, or MTR."
            onSubmit={onSave}
            primaryAction="Save Unit"
            tableTitle="Existing Units"
            tableHint="Units listed here appear in item master selection."
            columns={columns}
            data={units}
            loading={loading}
            actions={['Delete']}
            onAction={(action, row) => action === 'Delete' && handleDelete(row.id)}
            stats={[{ label: 'Used In', value: 'Items' }]}
        >
            <div className="form-group">
                <label className="required-label">Item Unit Name <span className="required">*</span></label>
                <input
                    type="text"
                    className="login-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Example: PCS"
                    required
                />
            </div>
        </MasterDataPage>
    );
}
