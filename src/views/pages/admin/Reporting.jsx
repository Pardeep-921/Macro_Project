import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { apiUrl } from '../../../config/api';

export default function Reporting() {
    const [salesData, setSalesData] = useState([]);
    const [supplyData, setSupplyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('maco_user'))?.token;
                const headers = { 'Authorization': `Bearer ${token}` };

                const [sRes, supRes] = await Promise.all([
                    fetch(apiUrl('/api/reports/sales'), { headers }),
                    fetch(apiUrl('/api/reports/supplies'), { headers })
                ]);

                if (sRes.ok && supRes.ok) {
                    setSalesData(await sRes.json());
                    setSupplyData(await supRes.json());
                }
            } catch (err) {
                console.error('Report Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const totalRevenue = salesData.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0);
    const totalOrders = salesData.reduce((sum, item) => sum + Number(item.orderCount || 0), 0);
    const totalChallans = supplyData.reduce((sum, item) => sum + Number(item.challanCount || 0), 0);

    if (loading) {
        return (
            <div className="crm-page">
                <PageHeader title="Advanced Analytics & Reporting" />
                <div className="crm-shell">
                    <div className="crm-loading">Crunching numbers...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="crm-page">
            <PageHeader title="Advanced Analytics & Reporting" />
            <div className="crm-shell">
                <div className="crm-summary-grid">
                    <article className="crm-summary-card tone-orange">
                        <span>Total Revenue</span>
                        <strong>Rs. {totalRevenue.toLocaleString()}</strong>
                    </article>
                    <article className="crm-summary-card tone-info">
                        <span>Total Orders</span>
                        <strong>{totalOrders}</strong>
                    </article>
                    <article className="crm-summary-card tone-success">
                        <span>Challans Uploaded</span>
                        <strong>{totalChallans}</strong>
                    </article>
                </div>

                <section className="crm-panel">
                    <div className="crm-panel-heading">
                        <div>
                            <span className="crm-kicker">Sales</span>
                            <h2>Sales Performance (Last 6 Months)</h2>
                        </div>
                    </div>
                    <div className="report-grid">
                        {salesData.length === 0 ? (
                            <div className="crm-empty">No sales data available for this period.</div>
                        ) : (
                            salesData.map(item => (
                                <article key={item.month} className="report-card">
                                    <div className="report-card-header">
                                        <span>{item.month}</span>
                                        <strong>Rs. {parseFloat(item.totalRevenue || 0).toLocaleString()}</strong>
                                    </div>
                                    <p>{item.orderCount} Orders</p>
                                    <div className="bar-container">
                                        <div
                                            className="bar"
                                            style={{ width: `${Math.min(100, (item.totalRevenue / 100000) * 100)}%` }}
                                        ></div>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>

                <section className="crm-panel">
                    <div className="crm-panel-heading">
                        <div>
                            <span className="crm-kicker">Logistics</span>
                            <h2>Logistics Activity (Last 6 Months)</h2>
                        </div>
                    </div>
                    <div className="report-grid">
                        {supplyData.length === 0 ? (
                            <div className="crm-empty">No supply data recorded yet.</div>
                        ) : (
                            supplyData.map(item => (
                                <article key={item.month} className="report-card tone-green">
                                    <div className="report-card-header">
                                        <span>{item.month}</span>
                                        <strong>{item.challanCount}</strong>
                                    </div>
                                    <p>Challans Uploaded</p>
                                    <div className="bar-container">
                                        <div
                                            className="bar bg-green"
                                            style={{ width: `${Math.min(100, (item.challanCount / 20) * 100)}%` }}
                                        ></div>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
