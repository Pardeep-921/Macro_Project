import React, { useState } from 'react';
import MasterDataPage from '../../components/MasterDataPage';
import { useMasterDataController } from '../../../controllers/MasterDataController';

export default function ManageSubGroupItem() {
    const { data: categories, loading, handleSave, handleDelete } = useMasterDataController('Categories');
    const [name, setName] = useState('');

    const onSave = async (e) => {
        e.preventDefault();
        const res = await handleSave({ name });
        if (res.success) setName('');
        else alert(res.message);
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Sub Group Name' }
    ];

    return (
        <MasterDataPage
            title="Sub Item Master"
            description="Organize secondary product groups so item records stay easy to classify and search."
            formTitle="Add Sub Group"
            formHint="Use short, consistent names for cleaner item mapping."
            onSubmit={onSave}
            primaryAction="Save Sub Group"
            tableTitle="Existing Sub Groups"
            tableHint="These groups are available while creating item master records."
            columns={columns}
            data={categories}
            loading={loading}
            actions={['Delete']}
            onAction={(action, row) => action === 'Delete' && handleDelete(row.id)}
            stats={[{ label: 'Required Fields', value: '1' }]}
        >
            <div className="form-group">
                <label className="required-label">Sub Group Name <span className="required">*</span></label>
                <input
                    type="text"
                    className="login-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Example: School Bags"
                    required
                />
            </div>
        </MasterDataPage>
    );
}
