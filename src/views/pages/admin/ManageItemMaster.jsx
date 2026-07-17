import React, { useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
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

const initialSearchData = {
    itemCode: '',
    itemName: '',
    primary_group_id: '',
    sub_group_id: ''
};

export default function ManageItemMaster() {
    const { data: products, loading: pLoading, handleSave, handleDelete, refresh } = useMasterDataController('Products');
    const { data: primaryGroups } = useMasterDataController('PrimaryGroups');
    const { data: subGroups } = useMasterDataController('SubGroups');
    const { data: units } = useMasterDataController('Units');
    const { data: sizes } = useMasterDataController('Sizes');
    const [formData, setFormData] = useState(initialFormData);
    const [searchData, setSearchData] = useState(initialSearchData);

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

    const setSearchField = (field, value) => {
        setSearchData(prev => ({
            ...prev,
            [field]: value,
            ...(field === 'primary_group_id' ? { sub_group_id: '' } : {})
        }));
    };

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
        e.preventDefault();
        const primaryGroupName = primaryGroups.find(group => String(group.id) === String(searchData.primary_group_id))?.name || '';
        const subGroupName = subGroups.find(group => String(group.id) === String(searchData.sub_group_id))?.name || '';
        const searchValue = [
            searchData.itemCode,
            searchData.itemName,
            primaryGroupName,
            subGroupName
        ].filter(Boolean).join(' ');

        refresh(searchValue);
    };

    const resetSearch = () => {
        setSearchData(initialSearchData);
        refresh('');
    };

    const columns = [
        { key: 'itemCode', header: 'Item Code' },
        { key: 'name', header: 'Item Name' },
        { key: 'primaryGroupName', header: 'Primary Group Name' },
        { key: 'subGroupName', header: 'Item Group Name' },
        { key: 'size', header: 'Item Size' },
        { key: 'uom', header: 'Item Unit' },
        { key: 'rate', header: 'List Price' },
        { key: 'mrp', header: 'MRP' }
    ];

    const handleTableAction = (action, row) => {
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
    };

    return (
        <div className="master-page item-master-page">
            <PageHeader title="Manage Item Master" />

            <div className="master-shell">
                <section className="master-hero">
                    <div>
                        <span className="master-eyebrow">Master Data</span>
                        <h2>Manage Item Master</h2>
                        <p>Create and maintain sellable item records with primary group, sub group, size, unit, and pricing references.</p>
                    </div>
                    <div className="master-record-pill">
                        <strong>{pLoading ? '...' : products.length}</strong>
                        <span>{products.length === 1 ? 'Record' : 'Records'}</span>
                    </div>
                </section>

                <section className="master-workspace">
                    <div className="item-master-main">
                        <section className="master-form-panel item-master-section">
                            <div className="item-master-titlebar">Manage Item Master</div>
                            <form onSubmit={onSave} className="master-form item-master-form">
                                <div className="form-grid master-form-grid">
                                    <div className="form-group">
                                        <label className="required-label">Item Code <span className="required">*</span></label>
                                        <input
                                            className="login-input"
                                            required
                                            value={formData.itemCode}
                                            onChange={e => setField('itemCode', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="required-label">Item Name <span className="required">*</span></label>
                                        <input
                                            className="login-input"
                                            required
                                            value={formData.name}
                                            onChange={e => setField('name', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="required-label">Item Primary Group <span className="required">*</span></label>
                                        <select
                                            className="login-input"
                                            value={formData.primary_group_id}
                                            onChange={e => setField('primary_group_id', e.target.value)}
                                            required
                                        >
                                            <option value="">--Select--</option>
                                            {primaryGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="required-label">Item Sub Group <span className="required">*</span></label>
                                        <select
                                            className="login-input"
                                            value={formData.sub_group_id}
                                            onChange={e => setField('sub_group_id', e.target.value)}
                                            required
                                        >
                                            <option value="">--Select--</option>
                                            {filteredSubGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="required-label">Item Size <span className="required">*</span></label>
                                        <select
                                            className="login-input"
                                            value={formData.item_size_id}
                                            onChange={e => setField('item_size_id', e.target.value)}
                                            required
                                        >
                                            <option value="">--Select--</option>
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
                                            <option value="">--Select--</option>
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
                                            <option value="">--Select--</option>
                                            {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="required-label">List Price(Selling Price) <span className="required">*</span></label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="login-input"
                                            required
                                            value={formData.rate}
                                            onChange={e => setField('rate', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="required-label">MRP (Maximum Sell Price) <span className="required">*</span></label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="login-input"
                                            required
                                            value={formData.mrp}
                                            onChange={e => setField('mrp', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="master-actions item-master-actions">
                                    <button type="submit" className="btn btn-primary">
                                        {formData.id ? 'Update' : 'Save'}
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                        Reset
                                    </button>
                                </div>
                            </form>
                        </section>

                        <section className="master-form-panel item-master-section">
                            <div className="item-master-titlebar">Item Master Details</div>
                            <form onSubmit={onSearch} className="master-form item-master-search-form">
                                <fieldset>
                                    <legend>Search Criteria</legend>
                                    <div className="form-grid master-form-grid">
                                        <div className="form-group">
                                            <label>Item Code</label>
                                            <input
                                                className="login-input"
                                                value={searchData.itemCode}
                                                onChange={e => setSearchField('itemCode', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Item Name</label>
                                            <input
                                                className="login-input"
                                                value={searchData.itemName}
                                                onChange={e => setSearchField('itemName', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Primary Item Group</label>
                                            <select
                                                className="login-input"
                                                value={searchData.primary_group_id}
                                                onChange={e => setSearchField('primary_group_id', e.target.value)}
                                            >
                                                <option value="">--Select--</option>
                                                {primaryGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Item Sub Group</label>
                                            <select
                                                className="login-input"
                                                value={searchData.sub_group_id}
                                                onChange={e => setSearchField('sub_group_id', e.target.value)}
                                            >
                                                <option value="">--Select--</option>
                                                {subGroups
                                                    .filter(group => !searchData.primary_group_id || String(group.primary_group_id) === String(searchData.primary_group_id))
                                                    .map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="master-actions item-master-actions">
                                        <button type="submit" className="btn btn-primary">Search</button>
                                        <button type="button" className="btn btn-secondary" onClick={resetSearch}>Reset</button>
                                    </div>
                                </fieldset>
                            </form>
                        </section>

                    </div>

                    <aside className="master-side-panel">
                        <span className="master-panel-kicker">Overview</span>
                        <h3>Quick Summary</h3>
                        <div className="master-stat-list">
                            <div className="master-stat-item">
                                <span>Total Records</span>
                                <strong>{pLoading ? '...' : products.length}</strong>
                            </div>
                            <div className="master-stat-item">
                                <span>Primary Groups</span>
                                <strong>{primaryGroups.length}</strong>
                            </div>
                            <div className="master-stat-item">
                                <span>Sub Groups</span>
                                <strong>{subGroups.length}</strong>
                            </div>
                            <div className="master-stat-item">
                                <span>Sizes</span>
                                <strong>{sizes.length}</strong>
                            </div>
                            <div className="master-stat-item">
                                <span>Units</span>
                                <strong>{units.length}</strong>
                            </div>
                        </div>
                    </aside>
                </section>

                <section className="master-table-panel">
                    <div className="master-table-heading">
                        <div>
                            <span className="master-panel-kicker">Directory</span>
                            <h3>Existing Items</h3>
                        </div>
                        <p>This directory feeds catalog, ordering, and inventory workflows.</p>
                    </div>

                    {pLoading ? (
                        <div className="master-loading">Loading records...</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={products}
                            actions={['Edit', 'Delete']}
                            onAction={handleTableAction}
                        />
                    )}
                </section>
            </div>
        </div>
    );
}
