// src/controllers/SupplyController.js
import { useState, useEffect } from 'react';
import { SupplyModel } from '../models/SupplyModel';
import { CustomerModel } from '../models/CustomerModel';

export const useSupplyController = () => {
    const [supplies, setSupplies] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [supplyData, customerData] = await Promise.all([
                SupplyModel.getSupplies(),
                CustomerModel.getCustomers()
            ]);
            setSupplies(supplyData);
            setCustomers(customerData);
        } catch {
            setError('Failed to fetch supply data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const searchSupplies = async (filters) => {
        setLoading(true);
        try {
            const data = await SupplyModel.getSupplies(filters);
            setSupplies(data);
        } catch {
            setError('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadChallan = async (challanData) => {
        try {
            const res = await SupplyModel.uploadChallan(challanData);
            if (res.success) {
                fetchInitialData();
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    return {
        supplies,
        customers,
        loading,
        error,
        searchSupplies,
        handleUploadChallan
    };
};
