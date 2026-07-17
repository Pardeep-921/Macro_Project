import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../../context/useAuth';
import { AuthModel } from '../../../models/AuthModel';

export default function Settings() {
    const { user } = useAuth();
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Customer';
    const displayName = user?.username || user?.name || 'User';
    const email = user?.email || 'Not available';
    const isAdmin = user?.role === 'admin';

    const handlePasswordChange = (event) => {
        const { name, value } = event.target;
        setPasswordForm((current) => ({ ...current, [name]: value }));
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();
        setPasswordStatus({ type: '', message: '' });

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPasswordStatus({ type: 'danger', message: 'Please fill all password fields.' });
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordStatus({ type: 'danger', message: 'New password must be at least 6 characters.' });
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordStatus({ type: 'danger', message: 'New password and confirm password do not match.' });
            return;
        }

        try {
            setIsSavingPassword(true);
            const response = await AuthModel.changePassword(
                user?.username,
                passwordForm.currentPassword,
                passwordForm.newPassword
            );
            setPasswordStatus({ type: 'success', message: response.message || 'Password updated successfully.' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPasswordStatus({ type: 'danger', message: err.message || 'Unable to update password.' });
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div>
            <PageHeader title="Settings" />

            <div className="content-card">
                <div className="card-body">
                    <div className="section-header-bar" style={{ marginTop: 0 }}>Account Settings</div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" value={displayName} readOnly />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={email} readOnly />
                        </div>

                        <div className="form-group">
                            <label>Role</label>
                            <input type="text" value={roleLabel} readOnly />
                        </div>

                        <div className="form-group">
                            <label>Theme</label>
                            <select defaultValue="default">
                                <option value="default">Default</option>
                                <option value="compact">Compact</option>
                            </select>
                        </div>
                    </div>

                    <div className="section-header-bar">Preferences</div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Dashboard View</label>
                            <select defaultValue="standard">
                                <option value="standard">Standard</option>
                                <option value="summary">Summary</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Notifications</label>
                            <select defaultValue="enabled">
                                <option value="enabled">Enabled</option>
                                <option value="disabled">Disabled</option>
                            </select>
                        </div>
                    </div>

                    <div className="btn-group">
                        <button type="button" className="btn btn-primary">Save Settings</button>
                        <button type="button" className="btn btn-secondary">Reset</button>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="content-card" style={{ marginTop: 16 }}>
                    <div className="card-body">
                        <div className="section-header-bar" style={{ marginTop: 0 }}>Change Admin Password</div>

                        {passwordStatus.message && (
                            <div className={`alert ${passwordStatus.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                                {passwordStatus.message}
                            </div>
                        )}

                        <form onSubmit={handlePasswordSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="currentPassword">Current Password</label>
                                    <input
                                        id="currentPassword"
                                        name="currentPassword"
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={handlePasswordChange}
                                        autoComplete="current-password"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="newPassword">New Password</label>
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordChange}
                                        autoComplete="new-password"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm New Password</label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={handlePasswordChange}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            <div className="btn-group">
                                <button type="submit" className="btn btn-primary" disabled={isSavingPassword}>
                                    {isSavingPassword ? 'Updating...' : 'Update Password'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                        setPasswordStatus({ type: '', message: '' });
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
