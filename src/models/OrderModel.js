// src/models/OrderModel.js
import { MockDb } from '../data/mockDb';

export const OrderModel = {
    getDraftOrders: async () => MockDb.getOrders(),
    getOrderDetails: async (orderNo) => MockDb.getOrderDetails(orderNo),
    getDashboardStats: async () => MockDb.getDashboardStats(),
    updateOrderStatus: async (orderNo, status) => MockDb.updateOrder(orderNo, { status }),
    approveOrder: async (orderNo) => MockDb.approveOrder(orderNo),
    rejectOrder: async (orderNo) => MockDb.rejectOrder(orderNo),
    createOrder: async (orderData) => MockDb.createOrder(orderData),
    updateOrder: async (orderNo, data) => MockDb.updateOrder(orderNo, data)
};
