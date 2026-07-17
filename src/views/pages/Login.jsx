import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import macoLogo from '../../assets/maco logo white.png';
import { useAuthController } from '../../controllers/AuthController';
import { useAuth } from '../../context/useAuth';
import './Login.css';

/**
 * Login Component - Enhanced UI/UX Implementation
 */
export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { email, setEmail, password, setPassword, error, handleLogin } = useAuthController();
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.isAuthenticated) {
            const redirectPath = user.role === 'admin' ? '/admin/catalog' : '/customer/catalog';
            navigate(redirectPath, { replace: true });
        }
        
        // Hide scrollbar (slider) on the right side
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [user, navigate]);

    return (
        <main className="login-page">
            <div className="login-container">
                {/* Branding Section */}
                <header className="login-header">
                    <div className="login-logo-wrapper">
                        <div className="logo-main-container">
                            <img
                                src={macoLogo}
                                alt="MACO Logo"
                                className="maco-logo-img"
                            />
                            <h1 className="logo-text-large">MACO</h1>
                        </div>

                    </div>
                </header>

                {/* Login Form Card */}
                <section className="login-card">

                    {error && (
                        <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                            {error}
                        </div>
                    )}

                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="email">Email Address / Username</label>
                            <input
                                id="email"
                                type="text"
                                className="login-input"
                                placeholder="admin, customer, or demo email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="form-group password-field-wrapper">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="login-input"
                                    placeholder="Enter your password securely"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.11-2.56 2.97-4.7 5.34-5.88" />
                                            <path d="M1 1l22 22" />
                                            <path d="M9.53 9.53A3.5 3.5 0 0 0 14.47 14.47" />
                                            <path d="M14.12 14.12A3.5 3.5 0 0 1 9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>


                        {/* Remember Me and Forgot Password */}
                        <div className="login-options">
                            <label className="remember-me">
                                <input type="checkbox" id="remember" />
                                <span>Remember me</span>
                            </label>
                            <a href="#" className="forgot-password" onClick={(e) => e.preventDefault()}>
                                Forgot Password?
                            </a>
                        </div>

                        {/* Submit Action */}
                        <button type="submit" className="btn-submit">
                            Login to your account
                        </button>
                    </form>

                    <div className="login-footer-links">
                        <span>Don't have an account? </span>
                        <Link to="/register" className="link-register">Register / Sign Up</Link>
                    </div>
                </section>
            </div>
        </main>
    );
}
