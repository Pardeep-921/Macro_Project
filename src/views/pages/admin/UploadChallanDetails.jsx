import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useSupplyController } from '../../../controllers/SupplyController';

export default function UploadChallanDetails() {
    const { companies, handleUploadChallan } = useSupplyController();
    const [formData, setFormData] = useState({
        challanNo: '',
        companyId: '',
        challanDate: new Date().toISOString().split('T')[0],
        items: [{ itemName: '', quantity: '', uom: '' }]
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleItemChange = (index, e) => {
        const newItems = [...formData.items];
        newItems[index][e.target.name] = e.target.value;
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { itemName: '', quantity: '', uom: '' }]
        });
    };

    const removeItem = (index) => {
        if (formData.items.length === 1) return;
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!formData.companyId) return alert('Please select a company');

        const res = await handleUploadChallan(formData);
        if (res.success) {
            alert('Challan uploaded successfully!');
            setFormData({
                challanNo: '', companyId: '', challanDate: new Date().toISOString().split('T')[0],
                items: [{ itemName: '', quantity: '', uom: '' }]
            });
        } else {
            alert(res.message);
        }
    };

    return (
        <div className="order-supply-page">
            <PageHeader title="Upload Challan Details" />
            <div className="order-supply-shell">
                <div className="order-supply-hero">
                    <div>
                        <span className="order-supply-kicker">Orders & Supply</span>
                        <h2>Upload Challan</h2>
                    </div>
                    <div className="order-supply-record-pill">
                        <strong>{formData.items.length}</strong>
                        <span>Line Items</span>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="order-supply-panel order-supply-form-panel">
                    <div className="order-supply-panel-heading">
                        <div>
                            <span className="order-supply-kicker">Challan</span>
                            <h3>Challan Basic Info</h3>
                        </div>
                    </div>

                    <div className="order-supply-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Challan No</label>
                                <input name="challanNo" type="text" className="login-input" required value={formData.challanNo} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Company Name</label>
                                <select name="companyId" className="login-input" value={formData.companyId} onChange={handleChange} required>
                                    <option value="">--Select Company--</option>
                                    {companies.map(c => <option key={c.companyId} value={c.companyId}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Challan Date</label>
                                <input name="challanDate" type="date" className="login-input" required value={formData.challanDate} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div className="order-supply-panel-heading order-supply-subheading">
                        <div>
                            <span className="order-supply-kicker">Items</span>
                            <h3>Challan Items</h3>
                        </div>
                    </div>

                    <div className="order-supply-form order-supply-items">
                        {formData.items.map((item, index) => (
                            <div key={index} className="order-supply-item-row form-grid">
                                <div className="form-group">
                                    <label>Item Name</label>
                                    <input name="itemName" type="text" className="login-input" value={item.itemName} onChange={(e) => handleItemChange(index, e)} required />
                                </div>
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input name="quantity" type="number" className="login-input" value={item.quantity} onChange={(e) => handleItemChange(index, e)} required />
                                </div>
                                <div className="form-group">
                                    <label>UOM</label>
                                    <div className="order-supply-inline-action">
                                        <input name="uom" type="text" className="login-input" value={item.uom} onChange={(e) => handleItemChange(index, e)} />
                                        {formData.items.length > 1 && (
                                            <button type="button" className="btn btn-danger order-supply-icon-btn" onClick={() => removeItem(index)} aria-label="Remove item">X</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" className="btn btn-secondary" onClick={addItem}>+ Add More Item</button>
                    </div>

                    <div className="order-supply-actions">
                        <button type="submit" className="btn btn-primary">Upload Challan Details</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
