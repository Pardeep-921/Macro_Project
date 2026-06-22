import React, { useState } from 'react';
import MasterDataPage from '../../components/MasterDataPage';
import { useMasterDataController } from '../../../controllers/MasterDataController';

export default function ManageShippingType() {
    const { data: carriers, loading, handleSave, handleDelete } = useMasterDataController('ShippingCarriers');
    const [formData, setFormData] = useState({ id: '', name: '' });

    const columns = [
        { key: 'id', header: 'Shipping ID' },
        { key: 'name', header: 'Shipping Method Name' },
    ];

    const onSave = async (e) => {
        e.preventDefault();
        const res = await handleSave(formData);
        if (res.success) setFormData({ id: '', name: '' });
        else alert(res.message);
    };

    return (
        <MasterDataPage
            title="Item Shipping"
            description="Maintain transporter and shipping method names used while preparing supply and dispatch records."
            formTitle={formData.id ? 'Update Shipping Type' : 'Add Shipping Type'}
            formHint="These carrier names are used when challans and dispatch records are prepared."
            onSubmit={onSave}
            primaryAction={formData.id ? 'Update Shipping Type' : 'Save Shipping Type'}
            secondaryAction={{ label: formData.id ? 'Cancel Edit' : 'Reset', onClick: () => setFormData({ id: '', name: '' }) }}
            tableTitle="Shipping Details"
            tableHint="Use consistent transporter names to keep dispatch reporting clean."
            columns={columns}
            data={carriers}
            loading={loading}
            actions={['Edit', 'Delete']}
            onAction={(action, row) => {
                if (action === 'Edit') setFormData({ id: row.id, name: row.name });
                if (action === 'Delete') handleDelete(row.id);
            }}
            stats={[{ label: 'Data Source', value: 'Database' }]}
        >
            <div className="form-group">
                <label className="required-label">Shipping Type <span className="required">*</span></label>
                <input
                    type="text"
                    className="login-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Example: SAI GOODS CARRIER"
                    required
                />
            </div>
        </MasterDataPage>
    );
}
