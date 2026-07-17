import { MockDb } from '../data/mockDb';

export const AuthModel = {
    login: async (email, password) => MockDb.login(email, password),
    register: async (fullname, email, password, role) => MockDb.register(fullname, email, password, role),
    changePassword: async (username, currentPassword, newPassword) =>
        MockDb.changePassword(username, currentPassword, newPassword),
    getPendingUsers: async () => MockDb.getPendingUsers(),
    approveUser: async (id) => MockDb.approveUser(id),
    rejectUser: async (id) => MockDb.rejectUser(id)
};
