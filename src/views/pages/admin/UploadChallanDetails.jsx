import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useSupplyController } from '../../../controllers/SupplyController';
import { MasterModel } from '../../../models/MasterModel';
import { OrderModel } from '../../../models/OrderModel';

export default function UploadChallanDetails() {
    const { handleUploadChallan } = useSupplyController();
    const [orders, setOrders] = useState([]);
    const [carriers, setCarriers] = useState([]);
    const [formData, setFormData] = useState({
        challanNo: '',
        orderNo: '',
        carrierId: '',
        challanDate: new Date().toISOString().split('T')[0],
        supplyDetails: ''
    });

    useEffect(() => {
        const loadDispatchMasters = async () => {
            const [orderData, carrierData] = await Promise.all([
                OrderModel.getDraftOrders(),
                MasterModel.ShippingCarriers.get()
            ]);
            setOrders(orderData.filter(order => order.order_status === 'ACCEPTED' || order.status === 'Accepted'));
            setCarriers(carrierData);
        };
        loadDispatchMasters().catch(err => console.error('Failed to load challan masters:', err));
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!formData.orderNo) return alert('Please select an accepted order');
        if (!formData.carrierId) return alert('Please select a shipping carrier');

        const res = await handleUploadChallan(formData);
        if (res.success) {
            alert('Challan uploaded successfully!');
            setFormData({
                challanNo: '',
                orderNo: '',
                carrierId: '',
                challanDate: new Date().toISOString().split('T')[0],
                supplyDetails: ''
            });
            setOrders(orders.filter(order => order.orderNo !== formData.orderNo));
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
                        <strong>{orders.length}</strong>
                        <span>Accepted Orders</span>
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
                                <label>Accepted Order</label>
                                <select name="orderNo" className="login-input" value={formData.orderNo} onChange={handleChange} required>
                                    <option value="">--Select Order--</option>
                                    {orders.map(order => (
                                        <option key={order.orderNo} value={order.orderNo}>
                                            {order.orderNo} - {order.customer} - Rs. {Number(order.amount || 0).toLocaleString('en-IN')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Challan Date</label>
                                <input name="challanDate" type="date" className="login-input" required value={formData.challanDate} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Shipping Carrier</label>
                                <select name="carrierId" className="login-input" value={formData.carrierId} onChange={handleChange} required>
                                    <option value="">--Select Carrier--</option>
                                    {carriers.map(carrier => <option key={carrier.id} value={carrier.id}>{carrier.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Supply Details</label>
                                <textarea name="supplyDetails" className="login-input" rows="3" value={formData.supplyDetails} onChange={handleChange} placeholder="Boxes, LR number, dispatch notes" />
                            </div>
                        </div>
                    </div>

                    <div className="order-supply-actions">
                        <button type="submit" className="btn btn-primary">Upload Challan Details</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
