import React, { useState } from 'react';
import MasterDataPage from '../../components/MasterDataPage';
import { useMasterDataController } from '../../../controllers/MasterDataController';

const initialFormData = {
    id: '',
    name: '',
    primary_group_id: '',
    chapter_heading_no: ''
};

export default function ManageSubGroupItem() {
    const { data: subGroups, loading, handleSave, handleDelete, refresh } = useMasterDataController('SubGroups');
    const { data: primaryGroups, loading: primaryLoading } = useMasterDataController('PrimaryGroups');
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
        { key: 'name', header: 'Sub Group Name' },
        { key: 'primaryGroupName', header: 'Primary Group' },
        { key: 'chapter_heading_no', header: 'Chapter Heading No' }
    ];

    return (
        <MasterDataPage
            title="Sub Item Master"
            description="Organize secondary product groups under primary groups with chapter heading references."
            formTitle={formData.id ? 'Update Sub Group' : 'Add Sub Group'}
            formHint="Select the parent primary group before saving the sub group."
            onSubmit={onSave}
            primaryAction={formData.id ? 'Update Sub Group' : 'Save Sub Group'}
            secondaryAction={formData.id ? { label: 'Cancel Edit', onClick: () => setFormData(initialFormData) } : null}
            tableTitle="Existing Sub Groups"
            tableHint="Sub groups are available while creating item master records."
            columns={columns}
            data={subGroups}
            loading={loading || primaryLoading}
            actions={['Edit', 'Delete']}
            onAction={(action, row) => {
                if (action === 'Edit') {
                    setFormData({
                        id: row.id,
                        name: row.name,
                        primary_group_id: row.primary_group_id || '',
                        chapter_heading_no: row.chapter_heading_no || ''
                    });
                }
                if (action === 'Delete') handleDelete(row.id);
            }}
            stats={[{ label: 'Primary Groups', value: primaryGroups.length }]}
        >
            <div className="form-group">
                <label className="required-label">Primary Group <span className="required">*</span></label>
                <select
                    className="login-input"
                    value={formData.primary_group_id}
                    onChange={e => setFormData({ ...formData, primary_group_id: e.target.value })}
                    required
                >
                    <option value="">Select primary group</option>
                    {primaryGroups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label className="required-label">Sub Group Name <span className="required">*</span></label>
                <input
                    type="text"
                    className="login-input"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Example: Lorries & Trucks"
                    required
                />
            </div>
            <div className="form-group">
                <label>Chapter Heading No</label>
                <input
                    type="text"
                    className="login-input"
                    value={formData.chapter_heading_no}
                    onChange={e => setFormData({ ...formData, chapter_heading_no: e.target.value })}
                    placeholder="Example: HS-8708"
                />
            </div>
            <div className="form-group">
                <label>Search Sub Groups</label>
                <input
                    type="search"
                    className="login-input"
                    value={search}
                    onChange={onSearch}
                    placeholder="Search name, parent group, chapter"
                />
            </div>
        </MasterDataPage>
    );
}
