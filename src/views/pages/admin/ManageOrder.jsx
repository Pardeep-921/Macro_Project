import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import SearchForm from '../../components/SearchForm';
import DataTable from '../../components/DataTable';
import { useOrderController } from '../../../controllers/OrderController';
import { PDFService } from '../../../services/PDFService';

export default function ManageOrder() {
    const { orders, loading, companies, approveOrders, rejectOrders, updateOrder, fetchOrderDetails } = useOrderController();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const pendingCount = orders.filter(order => order.status === 'Pending').length;
    const acceptedCount = orders.filter(order => order.status === 'Accepted').length;
    const totalAmount = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);

    const columns = [
        { key: 'orderNo', header: 'OrderNo' },
        { key: 'customer', header: 'Customer Name' },
        { key: 'poDate', header: 'PO Date' },
        { key: 'amount', header: 'NetAmount' },
        { key: 'status', header: 'Order Status' },
        { key: 'paymentStatus', header: 'Payment' },
        { key: 'trackingNo', header: 'Tracking' },
    ];

    const handleAction = async (action, row) => {
        if (action === 'Approve') approveOrders(row.orderNo);
        if (action === 'Reject') rejectOrders(row.orderNo);
        if (action === 'View') {
            setSelectedOrder(row);
            const res = await fetchOrderDetails(row.orderNo);
            if (res.success) setOrderDetails(res);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        const res = await updateOrder(selectedOrder.orderNo, {
            status: selectedOrder.status,
            paymentStatus: selectedOrder.paymentStatus,
            trackingNo: selectedOrder.trackingNo
        });
        setIsUpdating(false);
        if (res.success) {
            alert('Order updated successfully');
            setOrderDetails(null);
            setSelectedOrder(null);
        } else alert(res.message);
    };

    const handleInvoiceDownload = () => {
        if (!orderDetails || !selectedOrder) return;
        PDFService.generateInvoice(selectedOrder, orderDetails.items);
    };

    return (
        <div className="order-supply-page">
            <PageHeader title="Manage Order" />
            <div className="order-supply-shell">
                <div className="order-supply-hero">
                    <div>
                        <span className="order-supply-kicker">Orders & Supply</span>
                        <h2>Order Info</h2>
                    </div>
                    <div className="order-supply-record-pill">
                        <strong>{loading ? '...' : orders.length}</strong>
                        <span>Total Records</span>
                    </div>
                </div>

                <div className="order-supply-stats">
                    <div className="order-supply-stat tone-warning">
                        <span>Pending Orders</span>
                        <strong>{loading ? '...' : pendingCount}</strong>
                    </div>
                    <div className="order-supply-stat tone-success">
                        <span>Accepted Orders</span>
                        <strong>{loading ? '...' : acceptedCount}</strong>
                    </div>
                    <div className="order-supply-stat tone-info">
                        <span>Net Amount</span>
                        <strong>{loading ? '...' : `Rs. ${totalAmount.toLocaleString('en-IN')}`}</strong>
                    </div>
                </div>

                <div className="order-supply-panel">
                    <div className="order-supply-panel-heading">
                        <div>
                            <span className="order-supply-kicker">Filter</span>
                            <h3>Search Order Criteria</h3>
                        </div>
                    </div>
                    <div className="order-supply-form">
                        <SearchForm title="Search Order Criteria">
                            <div className="form-group">
                                <label>Customer Name</label>
                                <select defaultValue="--Select--">
                                    <option disabled>--Select--</option>
                                    {companies.map(c => <option key={c.companyId} value={c.companyId}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Order No</label>
                                <input type="text" />
                            </div>
                        </SearchForm>
                    </div>
                </div>

                <div className="order-supply-panel order-supply-table-panel">
                    <div className="order-supply-panel-heading">
                        <div>
                            <span className="order-supply-kicker">Records</span>
                            <h3>Order Details</h3>
                        </div>
                        <span className="order-supply-count">Total Record: {loading ? '...' : orders.length}</span>
                    </div>
                    {loading ? (
                        <div className="order-supply-loading">Loading...</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={orders}
                            actions={['View', 'Approve', 'Reject']}
                            onAction={handleAction}
                        />
                    )}

                    {orderDetails && (
                        <div className="modal-overlay" style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                        }}>
                            <div className="content-card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                                <div className="section-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Order Detail: {selectedOrder.orderNo}</span>
                                    <button onClick={() => setOrderDetails(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
                                </div>
                                <div className="card-body">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div>
                                            <p><strong>Customer:</strong> {selectedOrder.customer}</p>
                                            <p><strong>Date:</strong> {selectedOrder.poDate}</p>
                                            <p><strong>Amount:</strong> ₹{selectedOrder.amount}</p>
                                        </div>
                                        <form onSubmit={handleUpdate} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                                            <div className="form-group">
                                                <label>Order Status</label>
                                                <select 
                                                    className="login-input"
                                                    value={selectedOrder.status}
                                                    onChange={e => setSelectedOrder({...selectedOrder, status: e.target.value})}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Accepted">Accepted</option>
                                                    <option value="Dispatched">Dispatched</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Payment Status</label>
                                                <select 
                                                    className="login-input"
                                                    value={selectedOrder.paymentStatus}
                                                    onChange={e => setSelectedOrder({...selectedOrder, paymentStatus: e.target.value})}
                                                >
                                                    <option value="Unpaid">Unpaid</option>
                                                    <option value="Paid">Paid</option>
                                                    <option value="Refunded">Refunded</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Tracking Number</label>
                                                <input 
                                                    className="login-input"
                                                    value={selectedOrder.trackingNo || ''}
                                                    onChange={e => setSelectedOrder({...selectedOrder, trackingNo: e.target.value})}
                                                    placeholder="Enter tracking #"
                                                />
                                            </div>
                                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={isUpdating}>
                                                {isUpdating ? 'Saving...' : 'Update Order'}
                                            </button>
                                            <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={handleInvoiceDownload}>
                                                Download Invoice PDF
                                            </button>
                                        </form>
                                    </div>

                                    <div className="section-header-bar" style={{ fontSize: '14px' }}>Items in this Order</div>
                                    <table className="data-table" style={{ marginTop: '10px' }}>
                                        <thead>
                                            <tr>
                                                <th>Item Name</th>
                                                <th>Size</th>
                                                <th>Qty</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderDetails.items.map((item, i) => (
                                                <tr key={i}>
                                                    <td>{item.itemName}</td>
                                                    <td>{item.size || '-'}</td>
                                                    <td>{item.quantity} {item.uom}</td>
                                                    <td>₹{item.price}</td>
                                                    <td>₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
