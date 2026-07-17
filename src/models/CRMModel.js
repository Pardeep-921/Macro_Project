// src/models/CRMModel.js
import { MockDb } from '../data/mockDb';

export const CRMModel = {
    getLeads: async () => MockDb.getLeads(),
    createLead: async (leadData) => MockDb.createLead(leadData),
    convertLead: async (id, conversionData) => MockDb.convertLead(id, conversionData),
    getDeals: async () => MockDb.getDeals(),
    createDeal: async (dealData) => MockDb.createDeal(dealData),
    getTasks: async () => MockDb.getTasks(),
    createTask: async (taskData) => MockDb.createTask(taskData)
};
