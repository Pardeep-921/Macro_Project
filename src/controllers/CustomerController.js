import { useState, useEffect } from 'react';
import { CustomerModel } from '../models/CustomerModel';

export const useCustomerController = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCustomers = async (silent = false, search = '') => {
        if (!silent) setLoading(true);
        const data = await CustomerModel.getCustomers(search);
        setCustomers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSaveCustomer = async (customerData) => {
        const response = await CustomerModel.saveCustomer(customerData);
        if (response.success) {
            alert('Customer saved successfully!');
            fetchCustomers(true);
        } else {
            alert(response.message || 'Error saving customer');
        }
        return response.success;
    };

    const handleDeleteCustomer = async (id) => {
        if (!id) return false;
        if (!window.confirm('Are you sure you want to delete this customer?')) return false;
        const response = await CustomerModel.deleteCustomer(id);
        if (response.success) {
            alert('Customer deleted successfully!');
            fetchCustomers(true);
            return true;
        }
        alert(response.message || 'Error deleting customer');
        return false;
    };

    return {
        customers,
        loading,
        fetchCustomers,
        handleSaveCustomer,
        handleDeleteCustomer
    };
};
