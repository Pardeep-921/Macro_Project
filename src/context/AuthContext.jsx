import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('maco_user');
      if (!storedUser) return null;
      
      const parsed = JSON.parse(storedUser);
      const normalizedRole = String(parsed?.role || '').toLowerCase();
      if (parsed && (normalizedRole === 'user' || normalizedRole === 'customer')) {
        parsed.role = 'customer';
        localStorage.setItem('maco_user', JSON.stringify(parsed));
      }
      if (parsed && normalizedRole === 'admin') {
        parsed.role = 'admin';
        localStorage.setItem('maco_user', JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      return null;
    }
  });

  const login = React.useCallback((sessionOrRole, legacyToken) => {
    const session =
      typeof sessionOrRole === 'object'
        ? sessionOrRole
        : { role: sessionOrRole, token: legacyToken };
    const role = String(session.role || '').toLowerCase() === 'admin' ? 'admin' : 'customer';
    const userData = { isAuthenticated: true, ...session, role };
    setUser(userData);
    localStorage.setItem('maco_user', JSON.stringify(userData));
  }, []);

  const logout = React.useCallback(() => {
    setUser(null);
    localStorage.removeItem('maco_user');
  }, []);

  const contextValue = React.useMemo(() => ({
    user,
    login,
    logout
  }), [user, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
