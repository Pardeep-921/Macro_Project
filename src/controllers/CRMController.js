// src/controllers/CRMController.js
import { useState, useEffect } from 'react';
import { CRMModel } from '../models/CRMModel';

export const useCRMController = () => {
    const [leads, setLeads] = useState([]);
    const [deals, setDeals] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [leadData, dealData, taskData] = await Promise.all([
                CRMModel.getLeads(),
                CRMModel.getDeals(),
                CRMModel.getTasks()
            ]);
            setLeads(leadData);
            setDeals(dealData);
            setTasks(taskData);
        } catch (err) {
            setError(err.message || 'Failed to fetch CRM data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateLead = async (leadData) => {
        try {
            const res = await CRMModel.createLead(leadData);
            if (res.success) {
                fetchData(); // Refresh
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const handleConvertLead = async (id, conversionData) => {
        try {
            const res = await CRMModel.convertLead(id, conversionData);
            if (res.success) {
                fetchData(); // Refresh both leads and deals
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const handleCreateTask = async (taskData) => {
        try {
            const res = await CRMModel.createTask(taskData);
            if (res.success) {
                fetchData();
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const handleCreateDeal = async (dealData) => {
        try {
            const res = await CRMModel.createDeal(dealData);
            if (res.success) {
                fetchData();
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    return {
        leads,
        deals,
        tasks,
        loading,
        error,
        handleCreateLead,
        handleConvertLead,
        handleCreateTask,
        handleCreateDeal,
        refresh: fetchData
    };
};
