import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import ActivityNotifications from './ActivityNotifications';

export default function Layout({ userType = 'admin' }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="app-layout">
            <button className="mobile-toggle" onClick={toggleSidebar} aria-label="Toggle navigation">
                {isSidebarOpen ? 'x' : '☰'}
            </button>
            <div className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} onClick={closeSidebar}></div>
            <Sidebar userType={userType} isOpen={isSidebarOpen} onClose={closeSidebar} />
            <div className="main-content">
                <header className="app-topbar">
                    <div className="app-topbar-title">
                        <span>MACO ERP</span>
                        <strong>{userType === 'admin' ? 'Admin Workspace' : 'Customer Workspace'}</strong>
                    </div>
                    <ActivityNotifications />
                </header>
                <div className="page-content">
                    <Outlet />
                </div>
                <Footer />
            </div>
        </div>
    );
}
