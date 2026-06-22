import { apiUrl } from '../config/api';

export const AuthModel = {
    login: async (email, password, role) => {
        const response = await fetch(apiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error('Invalid server response');
        }

        if (response.ok && data.success) {
            return {
                success: true,
                role: data.role,
                roleMaster: data.role_master,
                username: data.username,
                companyIdCode: data.company_id_code,
                token: data.token
            };
        }

        throw new Error(data.message || 'Invalid credentials');
    },

    register: async (fullname, email, password, role) => {
        const response = await fetch(apiUrl('/api/auth/register'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullname,
                email,
                password,
                role
            })
        });

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error('Invalid server response');
        }

        if (response.ok && data.success) {
            return { success: true, user: data.user, message: data.message };
        }

        throw new Error(data.message || 'Registration failed');
    },

    getPendingUsers: async (token) => {
        const response = await fetch(apiUrl('/api/admin/pending-users'), {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok && data.success) return data.users;
        throw new Error(data.message || 'Failed to fetch users');
    },

    approveUser: async (id, token) => {
        const response = await fetch(apiUrl(`/api/admin/approve-user/${id}`), {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok && data.success) return data;
        throw new Error(data.message || 'Failed to approve user');
    },

    rejectUser: async (id, token) => {
        const response = await fetch(apiUrl(`/api/admin/reject-user/${id}`), {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok && data.success) return data;
        throw new Error(data.message || 'Failed to reject user');
    }
};
