import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import SearchForm from '../../components/SearchForm';
import DataTable from '../../components/DataTable';
import { apiUrl } from '../../../config/api';
import { PDFService } from '../../../services/PDFService';

export default function CustomerTrackSupply() {
    const [supplies, setSupplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ fromDate: '', toDate: '' });

    const authHeaders = () => {
        const token = JSON.parse(localStorage.getItem('maco_user'))?.token;
        return { Authorization: `Bearer ${token}` };
    };

    const fetchSupplies = async (nextFilters = filters) => {
        setLoading(true);
        const params = new URLSearchParams(nextFilters).toString();
        const response = await fetch(apiUrl(`/api/supplies?${params}`), { headers: authHeaders() });
        setSupplies(response.ok ? await response.json() : []);
        setLoading(false);
    };

    useEffect(() => {
        fetchSupplies();
    }, []);

    const handleSearch = (event) => {
        event.preventDefault();
        fetchSupplies(filters);
    };

    const downloadExport = async () => {
        const response = await fetch(apiUrl('/api/exports/supplies'), { headers: authHeaders() });
        if (!response.ok) return alert('Export failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `maco_my_supplies_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    const columns = [
        { key: 'challanNo', header: 'Challan No' },
        { key: 'orderNo', header: 'Order No' },
        { key: 'carrierName', header: 'Carrier' },
        { key: 'challanDate', header: 'Challan Date' },
        { key: 'supplyDetails', header: 'Supply Details' }
    ];

    return (
        <div className="order-supply-page">
            <PageHeader title="Track Supply Details" />
            <div className="order-supply-shell">
                <div className="order-supply-hero">
                    <div>
                        <span className="order-supply-kicker">Dispatch Ledger</span>
                        <h2>My Supply Updates</h2>
                    </div>
                    <div className="order-supply-record-pill">
                        <strong>{loading ? '...' : supplies.length}</strong>
                        <span>Total Records</span>
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
                                <label>From Date</label>
                                <input
                                    type="date"
                                    className="login-input"
                                    value={filters.fromDate}
                                    onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>To Date</label>
                                <input
                                    type="date"
                                    className="login-input"
                                    value={filters.toDate}
                                    onChange={e => setFilters({ ...filters, toDate: e.target.value })}
                                />
                            </div>
                            <div className="order-supply-search-actions">
                                <button type="submit" className="btn btn-primary">Search Supplies</button>
                                <button type="button" className="btn btn-secondary" onClick={downloadExport}>Export List</button>
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
                            <DataTable
                                columns={columns}
                                data={supplies}
                                actions={['PDF']}
                                onAction={(action, row) => {
                                    if (action === 'PDF') PDFService.generateChallan(row);
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
