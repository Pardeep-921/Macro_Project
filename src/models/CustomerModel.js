import { MockDb } from '../data/mockDb';

export const CustomerModel = {
    getCustomers: async (search = '') => MockDb.getCustomers(search),
    saveCustomer: async (customerData) => MockDb.saveCustomer(customerData),
    deleteCustomer: async (id) => MockDb.deleteCustomer(id)
};
