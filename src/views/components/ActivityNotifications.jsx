import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MockDb } from '../../data/mockDb';
import { useAuth } from '../../context/useAuth';

const typeLabels = {
    registration: 'Registration',
    order: 'Order',
    supply: 'Supply',
    task: 'Task',
    system: 'System'
};

function BellIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    );
}

function formatActivityTime(value) {
    if (!value) return 'Just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

export default function ActivityNotifications() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [readIds, setReadIds] = useState(() => {
        const readKey = `maco_notification_reads_${user?.username || user?.email || user?.role || 'guest'}`;
        try {
            return JSON.parse(localStorage.getItem(readKey) || '[]');
        } catch {
            return [];
        }
    });
    const [selectedActivity, setSelectedActivity] = useState(null);
    const panelRef = useRef(null);
    const readKey = `maco_notification_reads_${user?.username || user?.email || user?.role || 'guest'}`;

    const activities = useMemo(
        () => MockDb.getActivityNotifications({ role: user?.role, companyIdCode: user?.companyIdCode }),
        [user?.role, user?.companyIdCode]
    );

    const unreadCount = activities.filter((activity) => !readIds.includes(activity.id)).length;

    useEffect(() => {
        try {
            setReadIds(JSON.parse(localStorage.getItem(readKey) || '[]'));
        } catch {
            setReadIds([]);
        }
    }, [readKey]);

    useEffect(() => {
        localStorage.setItem(readKey, JSON.stringify(readIds));
    }, [readIds, readKey]);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleClick = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    const handleToggle = () => {
        setIsOpen((current) => !current);
    };

    const markAsRead = (activityId) => {
        setReadIds((current) => (
            current.includes(activityId) ? current : [...current, activityId]
        ));
    };

    const handleMarkAllRead = () => {
        setReadIds(activities.map((activity) => activity.id));
    };

    const handleActivityClick = (activity) => {
        markAsRead(activity.id);
        setSelectedActivity(activity);
    };

    const handleItemMarkRead = (event, activityId) => {
        event.stopPropagation();
        markAsRead(activityId);
    };

    return (
        <>
            <div className="activity-notifications" ref={panelRef}>
                <button
                    type="button"
                    className="notification-trigger"
                    onClick={handleToggle}
                    aria-label={`Activity notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                    aria-expanded={isOpen}
                >
                    <BellIcon />
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>

                {isOpen && (
                    <section className="notification-panel" aria-label="Recent activity">
                        <div className="notification-panel-header">
                            <div>
                                <span>Notifications</span>
                                <strong>{user?.role === 'customer' ? 'Order updates' : 'All activity'}</strong>
                            </div>
                            <small>{unreadCount} unread</small>
                        </div>

                        <div className="notification-panel-actions">
                            <button type="button" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                                Mark all as read
                            </button>
                        </div>

                        <div className="notification-list">
                            {activities.length === 0 ? (
                                <div className="notification-empty">No activity yet.</div>
                            ) : (
                                activities.map((activity) => {
                                    const isRead = readIds.includes(activity.id);
                                    return (
                                        <article
                                            key={activity.id}
                                            className={`notification-item tone-${activity.type} ${isRead ? 'is-read' : 'is-unread'}`}
                                            onClick={() => handleActivityClick(activity)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    handleActivityClick(activity);
                                                }
                                            }}
                                        >
                                            <div className="notification-dot" aria-hidden="true"></div>
                                            <div className="notification-copy">
                                                <div className="notification-item-header">
                                                    <span>{typeLabels[activity.type] || 'Activity'}</span>
                                                    <time dateTime={activity.createdAt}>{formatActivityTime(activity.createdAt)}</time>
                                                </div>
                                                <strong>{activity.title}</strong>
                                                <p>{activity.message}</p>
                                                {!isRead && (
                                                    <button
                                                        type="button"
                                                        className="notification-read-btn"
                                                        onClick={(event) => handleItemMarkRead(event, activity.id)}
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })
                            )}
                        </div>
                    </section>
                )}
            </div>

            {selectedActivity && (
                <div className="notification-modal-overlay" onClick={() => setSelectedActivity(null)}>
                    <section
                        className="notification-modal"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="notification-detail-title"
                    >
                        <div className="notification-modal-header">
                            <div>
                                <span>{typeLabels[selectedActivity.type] || 'Activity'}</span>
                                <h3 id="notification-detail-title">{selectedActivity.title}</h3>
                            </div>
                            <button type="button" onClick={() => setSelectedActivity(null)} aria-label="Close notification detail">
                                &times;
                            </button>
                        </div>

                        <p className="notification-modal-message">{selectedActivity.message}</p>

                        {selectedActivity.details?.rows?.length > 0 && (
                            <dl className="notification-detail-grid">
                                {selectedActivity.details.rows.map(([label, value]) => (
                                    <div key={label}>
                                        <dt>{label}</dt>
                                        <dd>{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}

                        {selectedActivity.details?.items?.length > 0 && (
                            <div className="notification-detail-items">
                                <h4>Order Items</h4>
                                <div className="notification-detail-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Qty</th>
                                                <th>Unit</th>
                                                <th>Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedActivity.details.items.map((item, index) => (
                                                <tr key={`${item.itemName || item.name}-${index}`}>
                                                    <td>{item.itemName || item.name || '-'}</td>
                                                    <td>{item.quantity || item.qty || '-'}</td>
                                                    <td>{item.uom || item.unit || '-'}</td>
                                                    <td>{Number(item.price || 0).toLocaleString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="notification-modal-actions">
                            <button type="button" className="btn btn-primary" onClick={() => setSelectedActivity(null)}>
                                Close
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
