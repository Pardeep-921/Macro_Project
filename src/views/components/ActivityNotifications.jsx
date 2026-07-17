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
    const [readIds, setReadIds] = useState([]);
    const panelRef = useRef(null);

    const activities = useMemo(
        () => MockDb.getActivityNotifications({ role: user?.role, companyIdCode: user?.companyIdCode }),
        [user?.role, user?.companyIdCode]
    );

    const unreadCount = activities.filter((activity) => !readIds.includes(activity.id)).length;

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
        setIsOpen((current) => {
            const next = !current;
            if (next) setReadIds(activities.map((activity) => activity.id));
            return next;
        });
    };

    return (
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
                            <strong>All activity</strong>
                        </div>
                        <small>{activities.length} updates</small>
                    </div>

                    <div className="notification-list">
                        {activities.length === 0 ? (
                            <div className="notification-empty">No activity yet.</div>
                        ) : (
                            activities.map((activity) => (
                                <article key={activity.id} className={`notification-item tone-${activity.type}`}>
                                    <div className="notification-dot" aria-hidden="true"></div>
                                    <div className="notification-copy">
                                        <div className="notification-item-header">
                                            <span>{typeLabels[activity.type] || 'Activity'}</span>
                                            <time dateTime={activity.createdAt}>{formatActivityTime(activity.createdAt)}</time>
                                        </div>
                                        <strong>{activity.title}</strong>
                                        <p>{activity.message}</p>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
