import { useState, useEffect } from 'react';
import { AuthModel } from '../models/AuthModel';
import { useAuth } from '../context/useAuth';
import { OrderModel } from '../models/OrderModel';
import { CustomerModel } from '../models/CustomerModel';

export const useDashboardController = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ pending: 0, accepted: 0, rejected: 0, pendingUsers: 0, revenue: 0 });
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [orders, customerData, users, dashboardStats] = await Promise.all([
                OrderModel.getDraftOrders(),
                CustomerModel.getCustomers(),
                AuthModel.getPendingUsers(user?.token).catch(() => []),
                OrderModel.getDashboardStats()
            ]);

            const newStats = orders.reduce((acc, order) => {
                const status = (order.status || '').toLowerCase();
                if (status === 'pending') acc.pending++;
                if (status === 'accepted') {
                    acc.accepted++;
                    acc.revenue += parseFloat(order.amount || 0);
                }
                if (status === 'rejected') acc.rejected++;
                return acc;
            }, { pending: 0, accepted: 0, rejected: 0, pendingUsers: 0, revenue: 0 });

            if (dashboardStats) {
                newStats.pending = dashboardStats.pending || 0;
                newStats.accepted = dashboardStats.accepted || 0;
                newStats.rejected = dashboardStats.rejected || 0;
                newStats.revenue = dashboardStats.revenue || 0;
            }

            newStats.pendingUsers = users.filter(u => u.status === 'pending').length;

            setStats(newStats);
            setCustomers(customerData);
        } catch (err) {
            console.error('Dashboard Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    return { stats, customers, loading };
};
