import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthModel } from '../models/AuthModel';
import { useAuth } from '../context/useAuth';

export const useAuthController = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await AuthModel.login(email, password, role);

            if (response.success) {
                const target =
                    response.role === 'admin'
                        ? '/admin/dashboard'
                        : '/customer/dashboard';

                login({
                    role: response.role,
                    roleMaster: response.roleMaster,
                    username: response.username,
                    companyIdCode: response.companyIdCode,
                    token: response.token
                });

                setEmail('');
                setPassword('');
                setRole('');

                navigate(target, { replace: true });
            }
        } catch (err) {
            console.error('Login Error:', err);
            setError(err.message || 'Invalid credentials');
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        role,
        setRole,
        error,
        handleLogin
    };
};
