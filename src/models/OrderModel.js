// src/models/OrderModel.js
import { apiUrl } from '../config/api';

const getToken = () => {
    const user = JSON.parse(localStorage.getItem('maco_user'));
    return user?.token ? `Bearer ${user.token}` : '';
};

export const OrderModel = {
    getDraftOrders: async () => {
        try {
            const response = await fetch(apiUrl('/api/orders'), {
                headers: { 'Authorization': getToken() }
            });
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            return [];
        }
    },
    getOrderDetails: async (orderNo) => {
        try {
            const response = await fetch(apiUrl(`/api/orders/${orderNo}`), {
                headers: { 'Authorization': getToken() }
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch order details:', error);
            return { success: false };
        }
    },
    getDashboardStats: async () => {
        try {
            const response = await fetch(apiUrl('/api/dashboard/stats'), {
                headers: { 'Authorization': getToken() }
            });
            if (!response.ok) return null;
            const data = await response.json();
            return data?.stats || null;
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            return null;
        }
    },
    updateOrderStatus: async (orderNo, status) => {
        const response = await fetch(apiUrl(`/api/orders/${orderNo}/status`), {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getToken()
            },
            body: JSON.stringify({ status })
        });
        return await response.json();
    },
    approveOrder: async (orderNo) => {
        const response = await fetch(apiUrl(`/api/orders/${orderNo}/approve`), { 
            method: 'POST',
            headers: { 'Authorization': getToken() }
        });
        return await response.json();
    },
    rejectOrder: async (orderNo) => {
        const response = await fetch(apiUrl(`/api/orders/${orderNo}/reject`), { 
            method: 'POST',
            headers: { 'Authorization': getToken() }
        });
        return await response.json();
    },
    createOrder: async (orderData) => {
        const response = await fetch(apiUrl('/api/orders'), {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': getToken() 
            },
            body: JSON.stringify(orderData)
        });
        return await response.json();
    },
    updateOrder: async (orderNo, data) => {
        const response = await fetch(apiUrl(`/api/orders/${orderNo}`), {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': getToken() 
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
};
