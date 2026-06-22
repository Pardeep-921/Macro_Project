// src/controllers/CompanyController.js
import { useState, useEffect } from 'react';
import { CompanyModel } from '../models/CompanyModel';

export const useCompanyController = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCompanies = async (silent = false, search = '') => {
        if (!silent) setLoading(true);
        const data = await CompanyModel.getCompanies(search);
        setCompanies(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleSaveCompany = async (companyData) => {
        const response = await CompanyModel.saveCompany(companyData);
        if (response.success) {
            alert('Company saved successfully!');
            fetchCompanies(true);
        } else {
            alert(response.message || 'Error saving company');
        }
        return response.success;
    };

    const handleDeleteCompany = async (id) => {
        if (!id) return false;
        if (!window.confirm('Are you sure you want to delete this company?')) return false;
        const response = await CompanyModel.deleteCompany(id);
        if (response.success) {
            alert('Company deleted successfully!');
            fetchCompanies(true);
            return true;
        }
        alert(response.message || 'Error deleting company');
        return false;
    };

    return {
        companies,
        loading,
        fetchCompanies,
        handleSaveCompany,
        handleDeleteCompany
    };
};
