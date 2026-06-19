import React from 'react';
import PageHeader from './PageHeader';
import DataTable from './DataTable';

export default function MasterDataPage({
    title,
    eyebrow = 'Master Data',
    description,
    formTitle,
    formHint,
    children,
    onSubmit,
    primaryAction,
    secondaryAction,
    tableTitle,
    tableHint,
    columns,
    data = [],
    loading = false,
    actions,
    onAction,
    stats = []
}) {
    const recordsLabel = data.length === 1 ? 'Record' : 'Records';

    return (
        <div className="master-page">
            <PageHeader title={title} />

            <div className="master-shell">
                <section className="master-hero">
                    <div>
                        <span className="master-eyebrow">{eyebrow}</span>
                        <h2>{title}</h2>
                        {description && <p>{description}</p>}
                    </div>
                    <div className="master-record-pill">
                        <strong>{loading ? '...' : data.length}</strong>
                        <span>{recordsLabel}</span>
                    </div>
                </section>

                <section className="master-workspace">
                    <div className="master-form-panel">
                        <div className="master-panel-heading">
                            <div>
                                <span className="master-panel-kicker">Create</span>
                                <h3>{formTitle}</h3>
                            </div>
                            {formHint && <p>{formHint}</p>}
                        </div>

                        <form onSubmit={onSubmit} className="master-form">
                            <div className="form-grid master-form-grid">
                                {children}
                            </div>
                            <div className="master-actions">
                                {secondaryAction && (
                                    <button type="button" className="btn btn-secondary" onClick={secondaryAction.onClick}>
                                        {secondaryAction.label}
                                    </button>
                                )}
                                <button type="submit" className="btn btn-primary">
                                    {primaryAction}
                                </button>
                            </div>
                        </form>
                    </div>

                    <aside className="master-side-panel">
                        <span className="master-panel-kicker">Overview</span>
                        <h3>Quick Summary</h3>
                        <div className="master-stat-list">
                            <div className="master-stat-item">
                                <span>Total Records</span>
                                <strong>{loading ? '...' : data.length}</strong>
                            </div>
                            {stats.map((stat) => (
                                <div className="master-stat-item" key={stat.label}>
                                    <span>{stat.label}</span>
                                    <strong>{stat.value}</strong>
                                </div>
                            ))}
                        </div>
                    </aside>
                </section>

                <section className="master-table-panel">
                    <div className="master-table-heading">
                        <div>
                            <span className="master-panel-kicker">Directory</span>
                            <h3>{tableTitle}</h3>
                        </div>
                        {tableHint && <p>{tableHint}</p>}
                    </div>

                    {loading ? (
                        <div className="master-loading">Loading records...</div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={data}
                            actions={actions}
                            onAction={onAction}
                        />
                    )}
                </section>
            </div>
        </div>
    );
}
