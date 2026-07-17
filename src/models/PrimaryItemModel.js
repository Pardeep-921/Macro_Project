// src/models/PrimaryItemModel.js
import { MockDb } from '../data/mockDb';

export const PrimaryItemModel = {
    getItems: async () => MockDb.getMaster('primary-items'),
    saveItem: async (itemData) => MockDb.saveMaster('primary-items', itemData, itemData.id),
    deleteItem: async (id) => MockDb.deleteMaster('primary-items', id)
};
