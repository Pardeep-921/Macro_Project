import React from 'react';
import PageHeader from '../../components/PageHeader';
import { useDashboardController } from '../../../controllers/DashboardController';

export default function AdminDashboard() {
    const { stats, companies, loading } = useDashboardController();
    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);

    const statCards = [
        {
            label: 'Pending Approvals',
            value: stats.pendingUsers,
            helper: 'Users awaiting access',
            tone: 'warning',
        },
        {
            label: 'Pending Orders',
            value: stats.pending,
            helper: 'Orders awaiting review',
            tone: 'orange',
        },
        {
            label: 'Accepted Orders',
            value: stats.accepted,
            helper: 'Successful transactions',
            tone: 'success',
        },
        {
            label: 'Total Revenue',
            value: formatCurrency(stats.revenue),
            helper: 'From accepted orders',
            tone: 'info',
        },
        {
            label: 'Rejected Orders',
            value: stats.rejected,
            helper: 'Cancelled or rejected items',
            tone: 'danger',
        },
    ];

    return (
        <div className="dashboard-page">
            <PageHeader title="Admin Dashboard Section" />

            <section className="dashboard-shell">
                <div className="dashboard-section-title">
                    <div>
                        <span className="dashboard-eyebrow">System Overview</span>
                        <h2>Quick Stats</h2>
                    </div>
                    <span className={`dashboard-status ${loading ? 'is-loading' : ''}`}>
                        {loading ? 'Updating' : 'Live'}
                    </span>
                </div>

                <div className="dashboard-stat-grid" aria-busy={loading}>
                    {statCards.map((card) => (
                        <article key={card.label} className={`dashboard-stat-card tone-${card.tone}`}>
                            <div className="stat-label">{card.label}</div>
                            <div className="stat-value">{card.value}</div>
                            <div className="stat-helper">{card.helper}</div>
                        </article>
                    ))}
                </div>

                <div className="dashboard-filter-panel">
                    <div>
                        <h3>Quick Filter by Customer</h3>
                        <p>Select a customer to review related activity.</p>
                    </div>
                    <select className="dashboard-select" defaultValue="">
                        <option value="" disabled>
                            Select Customer
                        </option>
                        {companies.map((company) => (
                            <option key={company.companyId} value={company.companyId}>
                                {company.name}
                            </option>
                        ))}
                    </select>
                </div>

                <p className="dashboard-note">
                    Real-time system health monitor. Use the sidebar to manage specific modules.
                </p>
            </section>
        </div>
    );
}
