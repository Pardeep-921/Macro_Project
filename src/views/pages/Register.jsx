import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import macoLogo from '../../assets/maco logo white.png';
import './Login.css';
import { AuthModel } from '../../models/AuthModel';

const initialCustomerDetails = {
    companyId: '',
    customerName: '',
    username: '',
    firstName: '',
    lastName: '',
    contact: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
    panNo: '',
    gstinNo: '',
    registrationNo: ''
};

const detailFields = [
    ['companyId', 'Customer Id', 'M10001'],
    ['customerName', 'Customer Name', 'Enter customer name'],
    ['username', 'Username', 'Login username'],
    ['firstName', 'First Name', 'Contact first name'],
    ['lastName', 'Last Name', 'Contact last name'],
    ['contact', 'Contact No', '9876543210'],
    ['address1', 'Address 1', 'Registered address'],
    ['address2', 'Address 2', 'Additional address'],
    ['city', 'City', 'New Delhi'],
    ['state', 'State', 'Delhi'],
    ['pincode', 'Pincode', '110001'],
    ['panNo', 'PAN No', 'ABCDE1234F'],
    ['gstinNo', 'GSTIN No', 'GSTIN number'],
    ['registrationNo', 'Registration No', 'Customer registration']
];

const buildCustomerDetails = (fullname, email, companyId) => {
    const nameParts = fullname.trim().split(/\s+/).filter(Boolean);

    return {
        ...initialCustomerDetails,
        companyId,
        customerName: fullname.trim(),
        username: email.trim(),
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ')
    };
};

export default function Register() {
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role] = useState('customer');
    const [customerDetails, setCustomerDetails] = useState(initialCustomerDetails);
    const [sameAsAddress1, setSameAsAddress1] = useState(false);
    const [showDetailsPopup, setShowDetailsPopup] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
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
            const nextCustomerId = await AuthModel.getNextCustomerId();
            setCustomerDetails(buildCustomerDetails(fullname, email, nextCustomerId));
            setSameAsAddress1(false);
            setShowDetailsPopup(true);
        } catch (err) {
            setError(err.message || 'Unable to generate customer id');
        }
    };

    const handleDetailChange = (e) => {
        const { name, value } = e.target;
        setCustomerDetails(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'address1' && sameAsAddress1 ? { address2: value } : {})
        }));
    };

    const handleSameAddressToggle = (e) => {
        const checked = e.target.checked;
        setSameAsAddress1(checked);
        if (checked) {
            setCustomerDetails(prev => ({ ...prev, address2: prev.address1 }));
        }
    };

    const handleDetailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await AuthModel.register(
                fullname,
                email,
                password,
                role,
                customerDetails
            );

            if (response.success) {
                setSuccess(response.message || 'Registration successful!');
                setShowDetailsPopup(false);
                setFullname('');
                setEmail('');
                setPassword('');
                setCustomerDetails(initialCustomerDetails);
                setSameAsAddress1(false);
            }
        } catch (err) {
            setError(err.message || 'Registration failed');
        }
    };

    const closeDetailsPopup = () => {
        setShowDetailsPopup(false);
        setSameAsAddress1(false);
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

            {showDetailsPopup && (
                <div className="registration-modal-backdrop" role="presentation">
                    <section className="registration-modal" role="dialog" aria-modal="true" aria-labelledby="customer-details-title">
                        <div className="registration-modal-header">
                            <div>
                                <span className="registration-modal-kicker">Customer Master</span>
                                <h2 id="customer-details-title">Complete Customer Details</h2>
                            </div>
                            <button type="button" className="registration-modal-close" onClick={closeDetailsPopup} aria-label="Close details form">
                                X
                            </button>
                        </div>

                        <p className="registration-modal-note">
                            Fill all customer details to submit your registration for admin approval.
                        </p>

                        {error && (
                            <div className="registration-modal-alert">
                                {error}
                            </div>
                        )}

                        <form className="registration-details-form" onSubmit={handleDetailSubmit}>
                            <div className="registration-details-grid">
                                {detailFields.map(([name, label, placeholder]) => {
                                    const isCustomerId = name === 'companyId';
                                    const isAddress2 = name === 'address2';

                                    return (
                                    <div className="form-group" key={name}>
                                        <label htmlFor={`detail-${name}`}>{label} <span>*</span></label>
                                        <input
                                            id={`detail-${name}`}
                                            name={name}
                                            type="text"
                                            className={`login-input ${isCustomerId ? 'locked-input' : ''}`}
                                            placeholder={placeholder}
                                            required
                                            disabled={isCustomerId}
                                            readOnly={isAddress2 && sameAsAddress1}
                                            value={customerDetails[name]}
                                            onChange={handleDetailChange}
                                        />
                                        {isAddress2 && (
                                            <label className="registration-address-copy" htmlFor="registrationSameAsAddress1">
                                                <input
                                                    id="registrationSameAsAddress1"
                                                    type="checkbox"
                                                    checked={sameAsAddress1}
                                                    onChange={handleSameAddressToggle}
                                                />
                                                <span>Same as Address 1</span>
                                            </label>
                                        )}
                                    </div>
                                    );
                                })}
                            </div>

                            <div className="registration-modal-actions">
                                <button type="button" className="btn-cancel" onClick={closeDetailsPopup}>
                                    Back
                                </button>
                                <button type="submit" className="btn-submit">
                                    Submit for Approval
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
}
