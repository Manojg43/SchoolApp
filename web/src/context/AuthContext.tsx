'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    token: string;
    role: string;
    school_id: string;
    user_id: string;
    name: string;
    email: string;
    permissions: string[];
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    loading: boolean;
    hasPermission: (perm: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('school_user');
            return storedUser ? JSON.parse(storedUser) : null;
        }
        return null;
    });
    const [loading, setLoading] = useState(false); // No need to load if we read from LS synchronously
    const router = useRouter();

    // Removed useEffect for restoring user as it is done in useState initializer

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('school_user', JSON.stringify(userData));
        localStorage.setItem('school_token', userData.token);
        localStorage.setItem('school_id', userData.school_id);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('school_user');
        localStorage.removeItem('school_token');
        localStorage.removeItem('school_id');
        router.push('/login');
    };

    const hasPermission = (perm: string | string[]) => {
        if (!user || !user.permissions) return false;
        if (user.permissions.includes('is_superuser')) return true;

        if (Array.isArray(perm)) {
            return perm.some(p => user.permissions.includes(p)); // OR check
        }
        return user.permissions.includes(perm);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function PermissionGuard({ perm, children, fallback = null }: { perm: string | string[], children: React.ReactNode, fallback?: React.ReactNode }) {
    const { hasPermission } = useAuth();
    return hasPermission(perm) ? <>{children}</> : <>{fallback}</>;
}
