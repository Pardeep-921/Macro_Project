import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import macoLogo from '../../assets/maco logo white.png';
import './Login.css';
import { AuthModel } from '../../models/AuthModel';

export default function Register() {
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('customer');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    React.useEffect(() => {
        // Hide scrollbar (slider) on the right side
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await AuthModel.register(
                fullname,
                email,
                password,
                role
            );

            if (response.success) {
                // CHANGED: use backend message (pending approval vs admin created)
                setSuccess(response.message || 'Registration successful!');

                // Customers stay on page seeing the "pending approval" message
            }
        } catch (err) {
            setError(err.message || 'Registration failed');
        }
    };

    return (
        <main className="login-page">
            <div className="login-container">
                <header className="login-header">
                    <div className="login-logo-wrapper">
                        <div className="logo-main-container">
                            <img src={macoLogo} alt="MACO Logo" className="maco-logo-img" />
                            <h1 className="logo-text-large">MACO</h1>
                        </div>

                    </div>
                </header>

                <section className="login-card">
                    <div className="login-instruction">Create your account to get started</div>

                    {error && (
                        <div
                            style={{
                                color: 'red',
                                marginBottom: '15px',
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {success && (
                        <div
                            style={{
                                color: 'green',
                                marginBottom: '15px',
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }}
                        >
                            {success}
                        </div>
                    )}

                    <form className="login-form" onSubmit={handleRegister}>
                        <div className="form-group">
                            <label htmlFor="fullname">Full Name</label>
                            <input
                                id="fullname"
                                type="text"
                                className="login-input"
                                placeholder="Enter your full name"
                                required
                                value={fullname}
                                onChange={(e) => setFullname(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className="login-input"
                                placeholder="Enter your registered email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="login-input"
                                placeholder="Enter your password securely"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>


                        <button type="submit" className="btn-submit">
                            Register Account
                        </button>
                    </form>

                    <div className="login-footer-links">
                        <span>Already have an account? </span>
                        <Link to="/" className="link-register">Login here</Link>
                    </div>
                </section>
            </div>
        </main>
    );
}