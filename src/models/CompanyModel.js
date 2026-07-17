// src/models/CompanyModel.js
import { MockDb } from '../data/mockDb';

export const CompanyModel = {
    getCompanies: async (search = '') => MockDb.getCompanies(search),
    saveCompany: async (companyData) => MockDb.saveCompany(companyData),
    deleteCompany: async (id) => MockDb.deleteCompany(id)
};
