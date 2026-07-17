import React, { useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useOrderController } from '../../../controllers/OrderController';
import { PDFService } from '../../../services/PDFService';

const initialSearch = {
    customerId: '',
    orderNo: '',
    fromDate: '',
    toDate: '',
    orderType: ''
};

export default function ManageOrder() {
    const { orders, loading, customers, approveOrders, rejectOrders, fetchOrderDetails } = useOrderController();
    const [search, setSearch] = useState(initialSearch);
    const [appliedSearch, setAppliedSearch] = useState(initialSearch);
    const [selectedOrders, setSelectedOrders] = useState([]);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesCustomer = !appliedSearch.customerId || String(order.company_id) === String(appliedSearch.customerId);
            const matchesOrderNo = !appliedSearch.orderNo || String(order.orderNo || '').toLowerCase().includes(appliedSearch.orderNo.toLowerCase());
            const orderDate = order.poDate || order.po_date || '';
            const matchesFromDate = !appliedSearch.fromDate || orderDate >= appliedSearch.fromDate;
            const matchesToDate = !appliedSearch.toDate || orderDate <= appliedSearch.toDate;
            const matchesOrderType = !appliedSearch.orderType || String(order.status || '').toLowerCase() === appliedSearch.orderType.toLowerCase();

            return matchesCustomer && matchesOrderNo && matchesFromDate && matchesToDate && matchesOrderType;
        });
    }, [orders, appliedSearch]);

    const selectedVisibleOrders = filteredOrders.filter(order => selectedOrders.includes(order.orderNo));
    const allVisibleSelected = filteredOrders.length > 0 && selectedVisibleOrders.length === filteredOrders.length;

    const setSearchField = (field, value) => {
        setSearch(prev => ({ ...prev, [field]: value }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setAppliedSearch(search);
        setSelectedOrders([]);
    };

    const handleReset = () => {
        setSearch(initialSearch);
        setAppliedSearch(initialSearch);
        setSelectedOrders([]);
    };

    const toggleOrder = (orderNo) => {
        setSelectedOrders(prev => (
            prev.includes(orderNo)
                ? prev.filter(item => item !== orderNo)
                : [...prev, orderNo]
        ));
    };

    const toggleAllVisible = () => {
        setSelectedOrders(allVisibleSelected ? [] : filteredOrders.map(order => order.orderNo));
    };

    const approveSelected = async () => {
        if (selectedOrders.length === 0) return alert('Select an order to approve');
        for (const orderNo of selectedOrders) {
            await approveOrders(orderNo);
        }
        setSelectedOrders([]);
    };

    const rejectSelected = async () => {
        if (selectedOrders.length === 0) return alert('Select an order to reject');
        for (const orderNo of selectedOrders) {
            await rejectOrders(orderNo);
        }
        setSelectedOrders([]);
    };

    const downloadPdf = async (order) => {
        const res = await fetchOrderDetails(order.orderNo);
        if (res.success) PDFService.generateInvoice(order, res.items);
        else alert(res.message || 'Unable to download PDF');
    };

    const formatDate = (value) => {
        if (!value) return '';
        const [year, month, day] = String(value).split('-');
        return year && month && day ? `${day}-${month}-${year}` : value;
    };

    const acceptRejectDate = (order) => {
        if (order.status === 'Pending') return '';
        return formatDate(order.acceptDate || order.review_date || order.accept_reject_date || '');
    };

    return (
        <div className="order-supply-page manage-order-info-page">
            <PageHeader title="Manage Order" />

            <div className="order-supply-shell">
                <section className="manage-order-card">
                    <div className="manage-order-titlebar">Manage Order</div>

                    <form onSubmit={handleSearch} className="order-supply-form manage-order-search">
                        <fieldset>
                            <legend>Search Order Criteria</legend>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Customer Name</label>
                                    <select
                                        value={search.customerId}
                                        onChange={e => setSearchField('customerId', e.target.value)}
                                    >
                                        <option value="">--Select--</option>
                                        {customers.map(customer => (
                                            <option key={customer.id} value={customer.id}>{customer.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Order No</label>
                                    <input
                                        type="text"
                                        value={search.orderNo}
                                        onChange={e => setSearchField('orderNo', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>From Date</label>
                                    <input
                                        type="date"
                                        value={search.fromDate}
                                        onChange={e => setSearchField('fromDate', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>To Date</label>
                                    <input
                                        type="date"
                                        value={search.toDate}
                                        onChange={e => setSearchField('toDate', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Order Type</label>
                                    <select
                                        value={search.orderType}
                                        onChange={e => setSearchField('orderType', e.target.value)}
                                    >
                                        <option value="">--Select--</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Accepted">Accepted</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Dispatched">Dispatched</option>
                                    </select>
                                </div>
                                <div className="manage-order-total">Total Record: {loading ? '...' : filteredOrders.length}</div>
                            </div>
                            <div className="btn-group">
                                <button type="submit" className="btn btn-primary">Search</button>
                                <button type="button" className="btn btn-secondary" onClick={handleReset}>Reset</button>
                            </div>
                        </fieldset>
                    </form>

                    <section className="manage-order-details">
                        <fieldset>
                            <legend>Order Details</legend>
                            {loading ? (
                                <div className="order-supply-loading">Loading...</div>
                            ) : (
                                <div className="manage-order-table-scroll">
                                    <table className="data-table manage-order-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    <label className="manage-order-check-all">
                                                        <input
                                                            type="checkbox"
                                                            checked={allVisibleSelected}
                                                            onChange={toggleAllVisible}
                                                        />
                                                        <span>All</span>
                                                    </label>
                                                </th>
                                                <th>OrderNo</th>
                                                <th>Customer Name</th>
                                                <th>Requisition No</th>
                                                <th>PO Date</th>
                                                <th>Destination</th>
                                                <th>NetAmount</th>
                                                <th>Order Status</th>
                                                <th>Reject/Accept Date</th>
                                                <th>Download PDF</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredOrders.map(order => (
                                                <tr key={order.orderNo}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedOrders.includes(order.orderNo)}
                                                            onChange={() => toggleOrder(order.orderNo)}
                                                        />
                                                    </td>
                                                    <td>{order.orderNo}</td>
                                                    <td>{order.customer}</td>
                                                    <td>{order.requisition || order.requisition_no || ''}</td>
                                                    <td>{formatDate(order.poDate || order.po_date)}</td>
                                                    <td>{order.destination || ''}</td>
                                                    <td>{order.amount || order.net_amount || ''}</td>
                                                    <td>{order.status}</td>
                                                    <td>{acceptRejectDate(order)}</td>
                                                    <td>
                                                        <button type="button" className="manage-order-pdf-link" onClick={() => downloadPdf(order)}>
                                                            PDF
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredOrders.length === 0 && (
                                                <tr>
                                                    <td colSpan="10" className="manage-order-empty">No records found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </fieldset>
                    </section>

                    <div className="manage-order-actions">
                        <button type="button" className="btn btn-primary" onClick={approveSelected}>Approve Order</button>
                        <button type="button" className="btn btn-primary" onClick={rejectSelected}>Reject Order</button>
                    </div>
                </section>
            </div>
        </div>
    );
}
