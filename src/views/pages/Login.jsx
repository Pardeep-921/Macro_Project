import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import macoLogo from '../../assets/maco logo white.png';
import { useAuthController } from '../../controllers/AuthController';
import { useAuth } from '../../context/useAuth';
import './Login.css';

/**
 * Login Component - Enhanced UI/UX Implementation
 */
export default function Login() {
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
                        {/* Email/Username Field */}
                        <div className="form-group">
                            <label htmlFor="username">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className="login-input"
                                placeholder="Enter your registered email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        {/* Password Field */}
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="login-input"
                                placeholder="Enter your password securely"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
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
