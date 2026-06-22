// src/controllers/MasterDataController.js
import { useState, useEffect } from 'react';
import { MasterModel } from '../models/MasterModel';

export const useMasterDataController = (entityKey) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async (search = '') => {
        setLoading(true);
        try {
            const result = await MasterModel[entityKey].get(search);
            setData(Array.isArray(result) ? result : []);
        } catch {
            setError(`Failed to fetch ${entityKey}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [entityKey]);

    const handleSave = async (payload) => {
        try {
            const res = payload.id && MasterModel[entityKey].update
                ? await MasterModel[entityKey].update(payload.id, payload)
                : await MasterModel[entityKey].create(payload);
            if (res.success) {
                fetchData();
                return { success: true };
            }
            return { success: false, message: res.message || 'Save failed' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            const res = await MasterModel[entityKey].delete(id);
            if (res.success) {
                fetchData();
                return { success: true };
            }
            return { success: false, message: res.message || 'Delete failed' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    return {
        data,
        loading,
        error,
        handleSave,
        handleDelete,
        refresh: fetchData
    };
};
