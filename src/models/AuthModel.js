import { MockDb } from '../data/mockDb';

export const AuthModel = {
    login: async (email, password) => MockDb.login(email, password),
    register: async (fullname, email, password, role, customerDetails) =>
        MockDb.register(fullname, email, password, role, customerDetails),
    getNextCustomerId: async () => MockDb.getNextCustomerId(),
    changePassword: async (username, currentPassword, newPassword) =>
        MockDb.changePassword(username, currentPassword, newPassword),
    getPendingUsers: async () => MockDb.getPendingUsers(),
    approveUser: async (id) => MockDb.approveUser(id),
    rejectUser: async (id) => MockDb.rejectUser(id)
};
