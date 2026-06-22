import React, { useMemo, useState } from 'react';
import MasterDataPage from '../../components/MasterDataPage';
import { useMasterDataController } from '../../../controllers/MasterDataController';

const initialFormData = {
    id: '',
    itemCode: '',
    name: '',
    primary_group_id: '',
    sub_group_id: '',
    item_size_id: '',
    unit_id: '',
    alternate_unit_id: '',
    rate: '',
    mrp: ''
};

export default function ManageItemMaster() {
    const { data: products, loading: pLoading, handleSave, handleDelete, refresh } = useMasterDataController('Products');
    const { data: primaryGroups } = useMasterDataController('PrimaryGroups');
    const { data: subGroups } = useMasterDataController('SubGroups');
    const { data: units } = useMasterDataController('Units');
    const { data: sizes } = useMasterDataController('Sizes');
    const [formData, setFormData] = useState(initialFormData);
    const [search, setSearch] = useState('');

    const filteredSubGroups = useMemo(() => {
        if (!formData.primary_group_id) return subGroups;
        return subGroups.filter(group => String(group.primary_group_id) === String(formData.primary_group_id));
    }, [formData.primary_group_id, subGroups]);

    const setField = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
            ...(field === 'primary_group_id' ? { sub_group_id: '' } : {})
        }));
    };

    const resetForm = () => setFormData(initialFormData);

    const onSave = async (e) => {
        e.preventDefault();
        const res = await handleSave({
            ...formData,
            item_code: formData.itemCode,
            item_name: formData.name,
            list_price: formData.rate,
            alternate_unit_id: formData.alternate_unit_id || null
        });
        if (res.success) resetForm();
        else alert(res.message);
    };

    const onSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        refresh(value);
    };

    const columns = [
        { key: 'itemCode', header: 'Item Code' },
        { key: 'name', header: 'Item Name' },
        { key: 'primaryGroupName', header: 'Primary Group' },
        { key: 'subGroupName', header: 'Sub Group' },
        { key: 'size', header: 'Size' },
        { key: 'uom', header: 'Unit' },
        { key: 'rate', header: 'List Price' },
        { key: 'mrp', header: 'MRP' }
    ];

    return (
        <MasterDataPage
            title="Item Master"
            description="Create and maintain sellable item records with roadmap group, size, unit, and pricing references."
            formTitle={formData.id ? 'Update Item' : 'Add Item'}
            formHint="Select valid master references before saving the item catalog record."
            onSubmit={onSave}
            primaryAction={formData.id ? 'Update Item' : 'Save Item'}
            secondaryAction={formData.id ? { label: 'Cancel Edit', onClick: resetForm } : null}
            tableTitle="Existing Items"
            tableHint="This directory feeds catalog, ordering, and inventory workflows."
            columns={columns}
            data={products}
            loading={pLoading}
            actions={['Edit', 'Delete']}
            onAction={(action, row) => {
                if (action === 'Edit') {
                    setFormData({
                        id: row.id,
                        itemCode: row.itemCode || '',
                        name: row.name || '',
                        primary_group_id: row.primary_group_id || '',
                        sub_group_id: row.sub_group_id || '',
                        item_size_id: row.item_size_id || '',
                        unit_id: row.unit_id || '',
                        alternate_unit_id: row.alternate_unit_id || '',
                        rate: row.rate ?? '',
                        mrp: row.mrp ?? ''
                    });
                }
                if (action === 'Delete') handleDelete(row.id);
            }}
            stats={[
                { label: 'Primary Groups', value: primaryGroups.length },
                { label: 'Sub Groups', value: subGroups.length },
                { label: 'Sizes', value: sizes.length },
                { label: 'Units', value: units.length }
            ]}
        >
            <div className="form-group">
                <label className="required-label">Item Code <span className="required">*</span></label>
                <input
                    className="login-input"
                    required
                    value={formData.itemCode}
                    onChange={e => setField('itemCode', e.target.value)}
                    placeholder="Example: AC-020"
                />
            </div>
            <div className="form-group">
                <label className="required-label">Item Name <span className="required">*</span></label>
                <input
                    className="login-input"
                    required
                    value={formData.name}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="Example: PP Atlas Copco"
                />
            </div>
            <div className="form-group">
                <label className="required-label">Primary Group <span className="required">*</span></label>
                <select
                    className="login-input"
                    value={formData.primary_group_id}
                    onChange={e => setField('primary_group_id', e.target.value)}
                    required
                >
                    <option value="">Select primary group</option>
                    {primaryGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label className="required-label">Sub Group <span className="required">*</span></label>
                <select
                    className="login-input"
                    value={formData.sub_group_id}
                    onChange={e => setField('sub_group_id', e.target.value)}
                    required
                >
                    <option value="">Select sub group</option>
                    {filteredSubGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label className="required-label">Size <span className="required">*</span></label>
                <select
                    className="login-input"
                    value={formData.item_size_id}
                    onChange={e => setField('item_size_id', e.target.value)}
                    required
                >
                    <option value="">Select size</option>
                    {sizes.map(size => <option key={size.id} value={size.id}>{size.name}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label className="required-label">Unit <span className="required">*</span></label>
                <select
                    className="login-input"
                    value={formData.unit_id}
                    onChange={e => setField('unit_id', e.target.value)}
                    required
                >
                    <option value="">Select unit</option>
                    {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label>Alternate Unit</label>
                <select
                    className="login-input"
                    value={formData.alternate_unit_id}
                    onChange={e => setField('alternate_unit_id', e.target.value)}
                >
                    <option value="">No alternate unit</option>
                    {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label className="required-label">List Price <span className="required">*</span></label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="login-input"
                    required
                    value={formData.rate}
                    onChange={e => setField('rate', e.target.value)}
                    placeholder="0.00"
                />
            </div>
            <div className="form-group">
                <label className="required-label">MRP <span className="required">*</span></label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="login-input"
                    required
                    value={formData.mrp}
                    onChange={e => setField('mrp', e.target.value)}
                    placeholder="0.00"
                />
            </div>
            <div className="form-group">
                <label>Search Items</label>
                <input
                    type="search"
                    className="login-input"
                    value={search}
                    onChange={onSearch}
                    placeholder="Search code, name, group, sub group"
                />
            </div>
        </MasterDataPage>
    );
}
