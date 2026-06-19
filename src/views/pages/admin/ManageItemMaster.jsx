import React, { useState } from 'react';
import MasterDataPage from '../../components/MasterDataPage';
import { useMasterDataController } from '../../../controllers/MasterDataController';

export default function ManageItemMaster() {
    const { data: products, loading: pLoading, handleSave, handleDelete } = useMasterDataController('Products');
    const { data: categories } = useMasterDataController('Categories');
    const { data: units } = useMasterDataController('Units');
    // We can fetch sizes if needed, but the form doesn't use it yet in a complex way
    
    const [formData, setFormData] = useState({
        itemCode: '', name: '', categoryId: '', description: '', uom: 'PCS', rate: '', mrp: '', stock: 0
    });

    const onSave = async (e) => {
        e.preventDefault();
        const res = await handleSave(formData);
        if (res.success) {
            setFormData({ itemCode: '', name: '', categoryId: '', description: '', uom: 'PCS', rate: '', mrp: '', stock: 0 });
        } else alert(res.message);
    };

    const columns = [
        { key: 'itemCode', header: 'Item Code' },
        { key: 'name', header: 'Item Name' },
        { key: 'category', header: 'Category' },
        { key: 'uom', header: 'UOM' },
        { key: 'rate', header: 'Rate' },
        { key: 'mrp', header: 'MRP' },
        { key: 'stock', header: 'Stock' }
    ];

    return (
        <MasterDataPage
            title="Item Master"
            description="Create and maintain sellable item records with category, unit, price, and stock details."
            formTitle="Add Item"
            formHint="Fill the core identity first, then add pricing and inventory values."
            onSubmit={onSave}
            primaryAction="Save Product"
            tableTitle="Existing Products"
            tableHint="This directory feeds catalog, ordering, and inventory workflows."
            columns={columns}
            data={products}
            loading={pLoading}
            actions={['Delete']}
            onAction={(action, row) => action === 'Delete' && handleDelete(row.id)}
            stats={[
                { label: 'Categories', value: categories.length },
                { label: 'Units', value: units.length || 'Default' }
            ]}
        >
            <div className="form-group">
                <label>Item Code</label>
                <input
                    className="login-input"
                    value={formData.itemCode}
                    onChange={e => setFormData({ ...formData, itemCode: e.target.value })}
                    placeholder="Example: MACO-001"
                />
            </div>
            <div className="form-group">
                <label className="required-label">Item Name <span className="required">*</span></label>
                <input
                    className="login-input"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter item name"
                />
            </div>
            <div className="form-group">
                <label>Category</label>
                <select
                    className="login-input"
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label>Unit (UOM)</label>
                <select
                    className="login-input"
                    value={formData.uom}
                    onChange={e => setFormData({ ...formData, uom: e.target.value })}
                >
                    {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    {units.length === 0 && <option value="PCS">PCS</option>}
                </select>
            </div>
            <div className="form-group">
                <label>Rate</label>
                <input
                    type="number"
                    className="login-input"
                    value={formData.rate}
                    onChange={e => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="0.00"
                />
            </div>
            <div className="form-group">
                <label>MRP</label>
                <input
                    type="number"
                    className="login-input"
                    value={formData.mrp}
                    onChange={e => setFormData({ ...formData, mrp: e.target.value })}
                    placeholder="0.00"
                />
            </div>
            <div className="form-group">
                <label>Current Stock</label>
                <input
                    type="number"
                    className="login-input"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                />
            </div>
            <div className="form-group full-width">
                <label>Description</label>
                <textarea
                    className="login-input"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional item description"
                />
            </div>
        </MasterDataPage>
    );
}
