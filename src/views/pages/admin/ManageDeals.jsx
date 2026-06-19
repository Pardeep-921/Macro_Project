// src/views/pages/admin/ManageDeals.jsx
import React from 'react';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { useCRMController } from '../../../controllers/CRMController';

export default function ManageDeals() {
    const { deals, loading } = useCRMController();
    const totalAmount = deals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
    const stageCount = new Set(deals.map(deal => deal.stage).filter(Boolean)).size;

    const columns = [
        { key: 'name', header: 'Deal Name' },
        { key: 'amount', header: 'Expected Amount (Rs.)', render: row => Number(row.amount || 0).toLocaleString() },
        { key: 'stage', header: 'Current Stage' },
        { key: 'createdAt', header: 'Creation Date' }
    ];

    return (
        <div className="crm-page">
            <PageHeader title="Deal Management" />
            <div className="crm-shell">
                <div className="crm-summary-grid">
                    <article className="crm-summary-card tone-orange">
                        <span>Open Deals</span>
                        <strong>{deals.length}</strong>
                    </article>
                    <article className="crm-summary-card tone-success">
                        <span>Expected Value</span>
                        <strong>Rs. {totalAmount.toLocaleString()}</strong>
                    </article>
                    <article className="crm-summary-card tone-info">
                        <span>Pipeline Stages</span>
                        <strong>{stageCount}</strong>
                    </article>
                </div>

                <section className="crm-panel crm-table-panel">
                    <div className="crm-panel-heading">
                        <div>
                            <span className="crm-kicker">Pipeline</span>
                            <h2>Active Deals & Pipelines</h2>
                        </div>
                        <span className="crm-count">{deals.length} Records</span>
                    </div>
                    {loading ? <div className="crm-loading">Loading deals...</div> : (
                        <div className="crm-table-scroll">
                            <DataTable
                                columns={columns}
                                data={deals}
                                actions={[]}
                                onAction={() => {}}
                            />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
