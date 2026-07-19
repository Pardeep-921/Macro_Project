import React from 'react';
import PageHeader from '../../components/PageHeader';
import { useOrderController } from '../../../controllers/OrderController';

export default function CustomerDashboard() {
    const { orders, loading } = useOrderController();
    const stats = orders.reduce((counts, order) => {
        const status = String(order.status || '').toLowerCase();
        if (status === 'pending') counts.pending += 1;
        if (status === 'accepted') counts.accepted += 1;
        if (status === 'rejected') counts.rejected += 1;
        return counts;
    }, { pending: 0, accepted: 0, rejected: 0 });

    const statCards = [
        {
            label: 'Pending Orders',
            value: stats.pending,
            helper: 'Orders awaiting review',
            tone: 'orange',
        },
        {
            label: 'Accepted Orders',
            value: stats.accepted,
            helper: 'Orders approved by MACO',
            tone: 'success',
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
            <PageHeader title="MACO Customer Dashboard" />

            <section className="dashboard-shell">
                <div className="dashboard-stat-grid" aria-busy={loading}>
                    {statCards.map((card) => (
                        <article key={card.label} className={`dashboard-stat-card tone-${card.tone}`}>
                            <div className="stat-label">{card.label}</div>
                            <div className="stat-value">{card.value}</div>
                            <div className="stat-helper">{card.helper}</div>
                        </article>
                    ))}
                </div>

                <p className="dashboard-note">
                    Your current order overview. Use the sidebar to view complete order details.
                </p>
            </section>
        </div>
    );
}
