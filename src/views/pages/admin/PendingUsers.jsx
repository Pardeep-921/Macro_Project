import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthModel } from '../../../models/AuthModel';
import { useAuth } from '../../../context/useAuth';
import './PendingUsers.css';

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
];

const STATUS_LABELS = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
};

const formatDate = (value) => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';

    return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
};

export default function PendingUsers() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMsg, setActionMsg] = useState('');
    const [actionTone, setActionTone] = useState('success');
    const [filter, setFilter] = useState('pending');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await AuthModel.getPendingUsers(user?.token);
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const updateUserStatus = (id, status) => {
        setUsers(prev => prev.map(item => (
            item.id === id ? { ...item, status } : item
        )));
    };

    const handleApprove = async (id, email) => {
        setActionMsg('');
        try {
            await AuthModel.approveUser(id, user?.token);
            setActionTone('success');
            setActionMsg(`${email} has been approved successfully.`);
            updateUserStatus(id, 'approved');
        } catch (err) {
            setActionTone('danger');
            setActionMsg(err.message || 'Failed to approve user.');
        }
    };

    const handleReject = async (id, email, wasApproved = false) => {
        setActionMsg('');
        try {
            await AuthModel.rejectUser(id, user?.token);
            setActionTone(wasApproved ? 'warning' : 'danger');
            setActionMsg(wasApproved ? `${email} access has been revoked.` : `${email} has been rejected.`);
            updateUserStatus(id, 'rejected');
        } catch (err) {
            setActionTone('danger');
            setActionMsg(err.message || 'Failed to reject user.');
        }
    };

    const counts = useMemo(() => ({
        all: users.length,
        pending: users.filter(item => item.status === 'pending').length,
        approved: users.filter(item => item.status === 'approved').length,
        rejected: users.filter(item => item.status === 'rejected').length,
    }), [users]);

    const displayed = useMemo(() => (
        filter === 'all' ? users : users.filter(item => item.status === filter)
    ), [filter, users]);

    return (
        <section className="approvals-page">
            <div className="approvals-shell">
                <header className="approvals-hero">
                    <div>
                        <span className="approvals-eyebrow">Administration</span>
                        <h1>User Registration Requests</h1>
                        <p>Review customer access requests and keep account permissions up to date.</p>
                    </div>
                    <button
                        className="approvals-refresh"
                        type="button"
                        onClick={fetchUsers}
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </header>

                <div className="approvals-stat-grid" aria-label="Registration request summary">
                    {FILTERS.map(item => (
                        <button
                            key={item.key}
                            className={`approvals-stat-card ${filter === item.key ? 'active' : ''}`}
                            type="button"
                            onClick={() => setFilter(item.key)}
                        >
                            <span>{item.label}</span>
                            <strong>{counts[item.key]}</strong>
                        </button>
                    ))}
                </div>

                {(actionMsg || error) && (
                    <div className={`approvals-alert ${error ? 'danger' : actionTone}`}>
                        <strong>{error ? 'Unable to complete request' : 'Update complete'}</strong>
                        <span>{error || actionMsg}</span>
                    </div>
                )}

                <div className="approvals-panel">
                    <div className="approvals-panel-header">
                        <div>
                            <h2>{FILTERS.find(item => item.key === filter)?.label} Requests</h2>
                            <p>{displayed.length} registration{displayed.length === 1 ? '' : 's'} shown</p>
                        </div>
                        <div className="approvals-filter-tabs" role="tablist" aria-label="Filter registrations">
                            {FILTERS.map(item => (
                                <button
                                    key={item.key}
                                    className={filter === item.key ? 'active' : ''}
                                    type="button"
                                    onClick={() => setFilter(item.key)}
                                >
                                    {item.label}
                                    <span>{counts[item.key]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="approvals-state">
                            <span className="approvals-spinner" aria-hidden="true"></span>
                            Loading registration requests...
                        </div>
                    ) : displayed.length === 0 ? (
                        <div className="approvals-empty">
                            <strong>No {filter === 'all' ? '' : filter} registrations found</strong>
                            <span>New customer requests will appear here when they are submitted.</span>
                        </div>
                    ) : (
                        <div className="approvals-table-wrap">
                            <table className="approvals-table">
                                <thead>
                                    <tr>
                                        <th>Applicant</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Registered On</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayed.map(item => {
                                        const name = item.fullname || 'Unnamed User';
                                        const email = item.email || item.username || '-';
                                        const status = item.status || 'pending';

                                        return (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="approvals-user">
                                                        <span className="approvals-avatar">{getInitials(name)}</span>
                                                        <div>
                                                            <strong>{name}</strong>
                                                            <span>ID #{item.id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="approvals-email">{email}</td>
                                                <td className="approvals-role">{item.role || '-'}</td>
                                                <td>
                                                    <span className={`approvals-status ${status}`}>
                                                        {STATUS_LABELS[status] || status}
                                                    </span>
                                                </td>
                                                <td className="approvals-date">{formatDate(item.createdAt)}</td>
                                                <td>
                                                    <div className="approvals-actions">
                                                        {status !== 'approved' && (
                                                            <button
                                                                className="approve"
                                                                type="button"
                                                                onClick={() => handleApprove(item.id, email)}
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                        {status !== 'rejected' && (
                                                            <button
                                                                className="reject"
                                                                type="button"
                                                                onClick={() => handleReject(item.id, email)}
                                                            >
                                                                Reject
                                                            </button>
                                                        )}
                                                        {status === 'approved' && (
                                                            <button
                                                                className="revoke"
                                                                type="button"
                                                                onClick={() => handleReject(item.id, email, true)}
                                                            >
                                                                Revoke
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
