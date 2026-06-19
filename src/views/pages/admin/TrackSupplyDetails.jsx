import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import SearchForm from '../../components/SearchForm';
import DataTable from '../../components/DataTable';
import { useSupplyController } from '../../../controllers/SupplyController';

export default function TrackSupplyDetails() {
    const { supplies, companies, loading, searchSupplies } = useSupplyController();
    const [filters, setFilters] = useState({ companyId: '', fromDate: '', toDate: '' });
    const totalQuantity = supplies.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const challanCount = new Set(supplies.map(item => item.challanNo).filter(Boolean)).size;

    const handleSearch = (e) => {
        e.preventDefault();
        searchSupplies(filters);
    };

    const columns = [
        { key: 'challanNo', header: 'Challan No' },
        { key: 'companyId', header: 'Company' },
        { key: 'challanDate', header: 'Challan Date' },
        { key: 'itemName', header: 'Item Name' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'uom', header: 'UOM' }
    ];

    return (
        <div className="order-supply-page">
            <PageHeader title="Track Supply Details" />
            <div className="order-supply-shell">
                <div className="order-supply-hero">
                    <div>
                        <span className="order-supply-kicker">Orders & Supply</span>
                        <h2>Track Supply</h2>
                    </div>
                    <div className="order-supply-record-pill">
                        <strong>{loading ? '...' : supplies.length}</strong>
                        <span>Total Records</span>
                    </div>
                </div>

                <div className="order-supply-stats">
                    <div className="order-supply-stat tone-info">
                        <span>Challans</span>
                        <strong>{loading ? '...' : challanCount}</strong>
                    </div>
                    <div className="order-supply-stat tone-success">
                        <span>Total Quantity</span>
                        <strong>{loading ? '...' : totalQuantity.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="order-supply-stat tone-warning">
                        <span>Companies</span>
                        <strong>{companies.length}</strong>
                    </div>
                </div>

                <div className="order-supply-panel">
                    <div className="order-supply-panel-heading">
                        <div>
                            <span className="order-supply-kicker">Filter</span>
                            <h3>Search Supply Criteria</h3>
                        </div>
                    </div>
                    <form onSubmit={handleSearch} className="order-supply-form">
                        <SearchForm title="Search Supply Criteria">
                            <div className="form-group">
                                <label>Company</label>
                                <select
                                    className="login-input"
                                    value={filters.companyId}
                                    onChange={e => setFilters({...filters, companyId: e.target.value})}
                                >
                                    <option value="">--All Companies--</option>
                                    {companies.map(c => <option key={c.companyId} value={c.companyId}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>From Date</label>
                                <input
                                    type="date"
                                    className="login-input"
                                    value={filters.fromDate}
                                    onChange={e => setFilters({...filters, fromDate: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>To Date</label>
                                <input
                                    type="date"
                                    className="login-input"
                                    value={filters.toDate}
                                    onChange={e => setFilters({...filters, toDate: e.target.value})}
                                />
                            </div>
                            <div className="order-supply-search-actions">
                                <button type="submit" className="btn btn-primary">Search Supplies</button>
                            </div>
                        </SearchForm>
                    </form>
                </div>

                <div className="order-supply-panel order-supply-table-panel">
                    <div className="order-supply-panel-heading">
                        <div>
                            <span className="order-supply-kicker">Records</span>
                            <h3>Supply Records</h3>
                        </div>
                    </div>
                    <div className="order-supply-scroll">
                        {loading ? (
                            <div className="order-supply-loading">Loading...</div>
                        ) : (
                            <DataTable columns={columns} data={supplies} actions={[]} onAction={() => {}} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
