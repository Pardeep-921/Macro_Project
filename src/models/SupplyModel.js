// src/models/SupplyModel.js
import { MockDb } from '../data/mockDb';

export const SupplyModel = {
    getSupplies: async (filters = {}) => MockDb.getSupplies(filters),
    uploadChallan: async (challanData) => MockDb.uploadChallan(challanData)
};
