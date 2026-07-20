import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useProductController } from '../../../controllers/ProductController';
import { useAuth } from '../../../context/useAuth';
import { OrderModel } from '../../../models/OrderModel';
import { PDFService } from '../../../services/PDFService';
import { useNavigate } from 'react-router-dom';

export default function AddItemCart() {
    const { user } = useAuth();
    const { cart, removeFromCart, clearCart, updateCartItemQuantity } = useProductController();
    const [statusMsg, setStatusMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const totalAmount = cart.reduce((acc, item) => acc + item.total, 0);

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return alert('Your cart is empty. Please add items from the catalog.');
        
        setSubmitting(true);
        setStatusMsg('');

        const orderData = {
            customer: user?.username || 'Guest',
            amount: totalAmount,
            destination: 'Direct Submission',
            requisition: 'PO-' + Date.now().toString().slice(-6),
            items: cart.map(item => ({
                item_id: item.item_id || item.id,
                id: item.item_id || item.id,
                name: item.name,
                size: item.size,
                size_id: item.size_id || item.item_size_id,
                qty: item.qty,
                quantity: item.qty,
                price: item.price,
                uom: item.uom
            }))
        };

        try {
            const res = await OrderModel.createOrder(orderData);
            if (res.success) {
                setStatusMsg(`Success! Purchase Order ${res.orderNo} has been submitted.`);
                
                // Generate PDF for the customer
                PDFService.generatePurchaseOrder(user, cart);
                
                // Clear cart after a short delay
                setTimeout(() => {
                    clearCart();
                    navigate('/customer/manage-order');
                }, 2000);
            } else {
                setStatusMsg('Failed to place order: ' + res.message);
            }
        } catch (err) {
            setStatusMsg('Error: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="po-form-container">
            <PageHeader title="Purchase Order Review" />
            
            <div className="content-card">
                <div className="card-body">
                    {statusMsg && (
                        <div className={`status-banner ${statusMsg.includes('Success') ? 'success' : 'error'}`}>
                            {statusMsg}
                        </div>
                    )}

                    <div className="po-customer-info">
                        <div className="section-header-bar" style={{ marginTop: 0 }}>Customer Details</div>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Customer Name:</label>
                                <span>{user?.username?.toUpperCase()}</span>
                            </div>
                            <div className="info-item">
                                <label>Role:</label>
                                <span>{user?.role?.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="section-header-bar">Selected Items Summary</div>
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Size</th>
                                    <th>Quantity</th>
                                    <th>UOM</th>
                                    <th>Rate</th>
                                    <th>Total</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item) => (
                                    <tr key={item.cartId}>
                                        <td>{item.name}</td>
                                        <td><strong>{item.size}</strong></td>
                                        <td>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={item.qty} 
                                                onChange={(e) => {
                                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                                    updateCartItemQuantity(item.cartId, val);
                                                }}
                                                className="qty-input"
                                                style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc' }}
                                            />
                                        </td>
                                        <td>{item.uom}</td>
                                        <td>₹{item.price}</td>
                                        <td>₹{item.total}</td>
                                        <td>
                                            <button 
                                                className="btn-text-danger" 
                                                onClick={() => removeFromCart(item.cartId)}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {cart.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-20">
                                            No items in Purchase Order. <a onClick={() => navigate('/customer/catalog')}>Browse Catalog</a>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {cart.length > 0 && (
                        <div className="po-summary-footer">
                            <div className="grand-total">
                                <span>Grand Total:</span>
                                <strong>₹{totalAmount.toLocaleString()}</strong>
                            </div>
                            <div className="btn-group">
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handlePlaceOrder}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Purchase Order'}
                                </button>
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={clearCart}
                                    disabled={submitting}
                                >
                                    Clear Cart
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
