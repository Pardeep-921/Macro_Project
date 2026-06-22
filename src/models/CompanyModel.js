// src/models/CompanyModel.js
import { apiUrl } from '../config/api';

const getToken = () => {
    const user = JSON.parse(localStorage.getItem('maco_user'));
    return user?.token ? `Bearer ${user.token}` : '';
};

export const CompanyModel = {
    getCompanies: async (search = '') => {
        try {
            const query = search ? `?search=${encodeURIComponent(search)}` : '';
            const response = await fetch(apiUrl(`/api/companies${query}`), {
                headers: { 'Authorization': getToken() }
            });
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch companies:', error);
            return [];
        }
    },
    saveCompany: async (companyData) => {
        try {
            const isUpdate = Boolean(companyData.id);
            const response = await fetch(apiUrl(isUpdate ? `/api/companies/${companyData.id}` : '/api/companies'), {
                method: isUpdate ? 'PUT' : 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': getToken()
                },
                body: JSON.stringify(companyData)
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to save company:', error);
            return { success: false, message: 'Server error' };
        }
    },
    deleteCompany: async (id) => {
        try {
            const response = await fetch(apiUrl(`/api/companies/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': getToken() }
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to delete company:', error);
            return { success: false, message: 'Server error' };
        }
    }
};
