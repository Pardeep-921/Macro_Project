// src/models/MasterModel.js
import { MockDb } from '../data/mockDb';

const createMasterEndpoints = (entity) => ({
    get: async (search = '') => MockDb.getMaster(entity, search),
    create: async (data) => MockDb.saveMaster(entity, data),
    update: async (id, data) => MockDb.saveMaster(entity, data, id),
    delete: async (id) => MockDb.deleteMaster(entity, id)
});

export const MasterModel = {
    Categories: createMasterEndpoints('categories'),
    Units: createMasterEndpoints('units'),
    Sizes: createMasterEndpoints('sizes'),
    PrimaryItems: createMasterEndpoints('primary-items'),
    PrimaryGroups: createMasterEndpoints('primary-groups'),
    SubGroups: createMasterEndpoints('sub-groups'),
    ShippingCarriers: createMasterEndpoints('shipping-carriers'),
    Products: createMasterEndpoints('products'),
    ItemMasterSchema: createMasterEndpoints('item-master-schema')
};
