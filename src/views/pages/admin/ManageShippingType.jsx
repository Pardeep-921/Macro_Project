import React, { useState } from 'react';
import MasterDataPage from '../../components/MasterDataPage';

export default function ManageShippingType() {
    const [name, setName] = useState('');

    const columns = [
        { key: 'id', header: 'Shipping ID' },
        { key: 'name', header: 'Shipping Method Name' },
    ];

    const data = [
        { id: '1', name: 'SAI GOODS CARRIER' },
        { id: '2', name: 'ATUL CARRIER' },
        { id: '3', name: 'V-TRANS LTD.' },
        { id: '4', name: 'NITCO ROADWAYS' },
        { id: '5', name: 'SAURASHTRA ROADWAYS' },
    ];

    const onSave = (e) => {
        e.preventDefault();
        setName('');
    };

    return (
        <MasterDataPage
            title="Item Shipping"
            description="Maintain transporter and shipping method names used while preparing supply and dispatch records."
            formTitle="Add Shipping Type"
            formHint="Shipping data is currently shown from local sample records."
            onSubmit={onSave}
            primaryAction="Save Shipping Type"
            secondaryAction={{ label: 'Reset', onClick: () => setName('') }}
            tableTitle="Shipping Details"
            tableHint="Use consistent transporter names to keep dispatch reporting clean."
            columns={columns}
            data={data}
            actions={['Delete']}
            stats={[{ label: 'Data Source', value: 'Sample' }]}
        >
            <div className="form-group">
                <label className="required-label">Shipping Type <span className="required">*</span></label>
                <input
                    type="text"
                    className="login-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Example: SAI GOODS CARRIER"
                    required
                />
            </div>
        </MasterDataPage>
    );
}
