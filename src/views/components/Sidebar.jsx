import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import macoLogo from '../../assets/maco logo white.png';
import { useAuth } from '../../context/useAuth';

const adminNavSections = [
    { type: 'link', path: '/admin/dashboard', label: 'Dashboard' },
    { type: 'link', path: '/admin/catalog', label: 'Product Marketplace' },
    {
        type: 'section',
        key: 'administration',
        label: 'Administration',
        items: [
            { path: '/admin/user-approvals', label: 'User Approvals' },
            { path: '/admin/manage-company', label: 'Manage Company' },
        ],
    },
    {
        type: 'section',
        key: 'master-data',
        label: 'Master Data',
        items: [
            { path: '/admin/manage-primary-item', label: 'Primary Item Master' },
            { path: '/admin/manage-sub-item', label: 'Sub Item Master' },
            { path: '/admin/manage-item-master', label: 'Item Master' },
            { path: '/admin/manage-item-unit', label: 'Item Unit' },
            { path: '/admin/manage-shipping', label: 'Item Shipping' },
            { path: '/admin/manage-item-size', label: 'Item Size' },
        ],
    },
    {
        type: 'section',
        key: 'orders-supply',
        label: 'Orders & Supply',
        items: [
            { path: '/admin/manage-order', label: 'Order Info' },
            { path: '/admin/upload-challan', label: 'Upload Challan' },
            { path: '/admin/track-supply', label: 'Track Supply' },
        ],
    },
    {
        type: 'section',
        key: 'crm',
        label: 'CRM',
        items: [
            { path: '/admin/manage-leads', label: 'Leads' },
            { path: '/admin/manage-deals', label: 'Deals' },
            { path: '/admin/manage-tasks', label: 'Tasks' },
        ],
    },
    {
        type: 'section',
        key: 'reports',
        label: 'Reports',
        items: [{ path: '/admin/reports', label: 'Advanced Reporting' }],
    },
];

const customerNavItems = [
    { path: '/customer/dashboard', label: 'Dashboard' },
    { path: '/customer/catalog', label: 'Product Marketplace' },

    { path: '/customer/add-item-cart', label: 'Add Item Cart' },
    { path: '/customer/manage-order', label: 'Manage Order' },
    { path: '/customer/track-supply', label: 'Track Supply Details' },
    { path: '/customer/manage-leads', label: 'My Leads' },
    { path: '/customer/manage-deals', label: 'My Deals' },
    { path: '/customer/manage-tasks', label: 'My Tasks' },
];

export default function Sidebar({ userType = 'admin', isOpen = false, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();
    const [openSections, setOpenSections] = useState({});
    const welcomeLabel = user?.username?.toUpperCase() || (userType === 'admin' ? 'ADMIN' : 'USER');

    const isPathActive = useCallback(
        (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
        [location.pathname]
    );

    useEffect(() => {
        if (userType !== 'admin') return;

        const activeSection = adminNavSections.find(
            (section) => section.type === 'section' && section.items.some((item) => isPathActive(item.path))
        );

        if (activeSection) {
            setOpenSections((current) => ({ ...current, [activeSection.key]: true }));
        }
    }, [isPathActive, userType]);

    const handleLogout = () => {
        logout();
        if (onClose) onClose();
        navigate('/');
    };

    const handleNavItemClick = () => {
        if (onClose) onClose();
    };

    const toggleSection = (sectionKey, isExpanded) => {
        setOpenSections((current) => ({ ...current, [sectionKey]: !isExpanded }));
    };

    const renderNavLink = (item, className = 'nav-item') => (
        <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavItemClick}
            className={({ isActive }) => `${className} ${isActive ? 'active' : ''}`}
        >
            {item.label}
        </NavLink>
    );

    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-logo">
                <img src={macoLogo} alt="MACO Logo" />
            </div>

            <div className="sidebar-welcome">
                <div>
                    Welcome, <span className="admin-label">{welcomeLabel}</span>
                </div>
                <div>
                    WS CMS | <a onClick={handleLogout}>Logout</a>
                </div>
            </div>

            <nav className="sidebar-nav">
                {userType === 'admin'
                    ? adminNavSections.map((section) => {
                          if (section.type === 'link') {
                              return renderNavLink(section);
                          }

                          const hasActiveItem = section.items.some((item) => isPathActive(item.path));
                          const isExpanded = openSections[section.key] ?? hasActiveItem;

                          return (
                              <div
                                  key={section.key}
                                  className={`nav-section ${isExpanded ? 'open' : ''} ${hasActiveItem ? 'active-section' : ''}`}
                              >
                                  <button
                                      type="button"
                                      className="nav-section-toggle"
                                      onClick={() => toggleSection(section.key, isExpanded)}
                                      aria-expanded={isExpanded}
                                  >
                                      <span>{section.label}</span>
                                      <span className="nav-section-chevron">&gt;</span>
                                  </button>

                                  {isExpanded && (
                                      <div className="nav-section-items">
                                          {section.items.map((item) => renderNavLink(item, 'nav-item nav-subitem'))}
                                      </div>
                                  )}
                              </div>
                          );
                      })
                    : customerNavItems.map((item) => renderNavLink(item))}
            </nav>
        </div>
    );
}
