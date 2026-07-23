import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useProductController } from '../../../controllers/ProductController';
import { useAuth } from '../../../context/useAuth';
import { OrderModel } from '../../../models/OrderModel';
import { CustomerModel } from '../../../models/CustomerModel';
import { PDFService } from '../../../services/PDFService';
import { useNavigate } from 'react-router-dom';

const REVIEW_SIZE_FALLBACKS = ['STD.', '001', '002', '003', '004', '005'];
const normalizeSizeLabel = (value) => String(value || '').trim().replace(/^0\.(\d{3})$/, '$1');

export default function AddItemCart() {
    const { user } = useAuth();
    const { cart, removeFromCart, clearCart, updateCartItemQuantity, updateCartItemSize } = useProductController();
    const [statusMsg, setStatusMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [customerProfile, setCustomerProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const navigate = useNavigate();

    const totalAmount = cart.reduce((acc, item) => acc + item.total, 0);
    const customerDisplayName =
        user?.companyName ||
        user?.company_name ||
        user?.display_name ||
        user?.fullname ||
        user?.name ||
        user?.username ||
        'Guest';

    useEffect(() => {
        if (cart.length === 0) setShowReviewModal(false);
    }, [cart.length]);

    const loadOrderHistory = async () => {
        setOrdersLoading(true);
        try {
            const ordersData = await OrderModel.getDraftOrders();
            setOrders(ordersData);
        } catch {
            setOrders([]);
        } finally {
            setOrdersLoading(false);
        }
    };

    useEffect(() => {
        const loadCustomerProfile = async () => {
            try {
                const customers = await CustomerModel.getCustomers();
                const profile = customers.find(customer =>
                    String(customer.companyId || customer.company_id_code || '') === String(user?.companyIdCode || user?.company_id_code || '') ||
                    String(customer.username || '').toLowerCase() === String(user?.username || '').toLowerCase() ||
                    String(customer.email || '').toLowerCase() === String(user?.email || '').toLowerCase()
                );
                setCustomerProfile(profile || null);
            } catch {
                setCustomerProfile(null);
            }
        };

        if (user?.role === 'customer') loadCustomerProfile();
    }, [user]);

    useEffect(() => {
        loadOrderHistory();
    }, []);

    const handleNext = () => {
        if (cart.length === 0) return alert('Your cart is empty. Please add items from the catalog.');
        setStatusMsg('');
        setShowReviewModal(true);
    };

    const getSizeOptions = (item) => {
        const options = Array.isArray(item.sizeOptions) ? item.sizeOptions.map(normalizeSizeLabel) : [];
        const size = normalizeSizeLabel(item.size);
        const shouldUseFallback = options.length === 0 && REVIEW_SIZE_FALLBACKS.includes(size);
        return Array.from(new Set([size, ...options, ...(shouldUseFallback ? REVIEW_SIZE_FALLBACKS : [])].filter(Boolean)));
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return alert('Your cart is empty. Please add items from the catalog.');
        
        setSubmitting(true);
        setStatusMsg('');

        const orderData = {
            customer: customerDisplayName,
            amount: totalAmount,
            destination: 'Direct Submission',
            requisition: 'PO-' + Date.now().toString().slice(-6),
            items: cart.map(item => ({
                item_id: item.item_id || item.id,
                id: item.item_id || item.id,
                name: item.name,
                size: normalizeSizeLabel(item.size),
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
                setShowReviewModal(false);
                
                // Generate PDF for the customer
                PDFService.generatePurchaseOrder({
                    ...user,
                    ...customerProfile,
                    username: customerDisplayName,
                    orderNo: res.orderNo
                }, cart);
                
                setTimeout(() => {
                    clearCart();
                    loadOrderHistory();
                }, 500);
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
                                <span>{customerDisplayName}</span>
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
                                        <td><strong>{normalizeSizeLabel(item.size)}</strong></td>
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
                                    onClick={handleNext}
                                    disabled={submitting}
                                >
                                    Next
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

            <div className="content-card po-history-card">
                <div className="card-body">
                    <div className="section-header-bar" style={{ marginTop: 0 }}>Order History</div>
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Order No</th>
                                    <th>Requisition No</th>
                                    <th>PO Date</th>
                                    <th>Destination</th>
                                    <th>Net Amount</th>
                                    <th>Order Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordersLoading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-20">Loading order history...</td>
                                    </tr>
                                ) : orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.orderNo || order.order_no}>
                                            <td>{order.orderNo || order.order_no}</td>
                                            <td>{order.requisition || order.requisition_no || '-'}</td>
                                            <td>{order.poDate || order.po_date || '-'}</td>
                                            <td>{order.destination || '-'}</td>
                                            <td>Rs. {Number(order.amount || order.net_amount || 0).toLocaleString('en-IN')}</td>
                                            <td>
                                                <span className={`po-status-badge po-status-${String(order.status || order.order_status || '').toLowerCase()}`}>
                                                    {order.status || order.order_status || 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-20">
                                            No order history yet. Submit Purchase Order to create your first order.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showReviewModal && (
                <div className="po-review-overlay" role="presentation">
                    <section className="po-review-modal" role="dialog" aria-modal="true" aria-labelledby="po-review-title">
                        <div className="po-review-header">
                            <div>
                                <span>Final Check</span>
                                <h2 id="po-review-title">Review Purchase Order</h2>
                            </div>
                            <button
                                type="button"
                                className="po-review-close"
                                onClick={() => setShowReviewModal(false)}
                                aria-label="Close review"
                                disabled={submitting}
                            >
                                x
                            </button>
                        </div>

                        <div className="po-review-customer">
                            <span>Customer Name</span>
                            <strong>{customerDisplayName}</strong>
                        </div>

                        <div className="data-table-wrapper po-review-table">
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
                                            <td>
                                                <select
                                                    className="po-review-size-select"
                                                    value={normalizeSizeLabel(item.size)}
                                                    onChange={(event) => updateCartItemSize(item.cartId, event.target.value)}
                                                    disabled={submitting || getSizeOptions(item).length <= 1}
                                                    aria-label={`Select size for ${item.name}`}
                                                >
                                                    {getSizeOptions(item).map((size) => (
                                                        <option key={size} value={size}>{size}</option>
                                                    ))}
                                                </select>
                                            </td>
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
                                                    disabled={submitting}
                                                />
                                            </td>
                                            <td>{item.uom}</td>
                                            <td>Rs. {Number(item.price || 0).toLocaleString('en-IN')}</td>
                                            <td>Rs. {Number(item.total || 0).toLocaleString('en-IN')}</td>
                                            <td>
                                                <button
                                                    className="btn-text-danger"
                                                    onClick={() => removeFromCart(item.cartId)}
                                                    disabled={submitting}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="po-review-footer">
                            <div className="grand-total">
                                <span>Grand Total:</span>
                                <strong>Rs. {totalAmount.toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="btn-group">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowReviewModal(false)}
                                    disabled={submitting}
                                >
                                    Back to Cart
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handlePlaceOrder}
                                    disabled={submitting || cart.length === 0}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Purchase Order'}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
