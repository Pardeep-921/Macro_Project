import { MockDb } from '../data/mockDb';

export const AuthModel = {
    login: async (email, password) => MockDb.login(email, password),
    register: async (fullname, email, password, role) => MockDb.register(fullname, email, password, role),
    getPendingUsers: async () => MockDb.getPendingUsers(),
    approveUser: async (id) => MockDb.approveUser(id),
    rejectUser: async (id) => MockDb.rejectUser(id)
};
