import { createContext, useContext, useState, ReactNode } from 'react';

const API = 'http://localhost:4000/api';

interface UserInfo {
    id: string;
    email: string;
    role: 'admin' | 'user';
    name: string;
    lastname: string;
}

interface AuthContextType {
    user: UserInfo | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string, lastname: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserInfo | null>(() => {
        const stored = localStorage.getItem('algo_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('algo_token'));

    const login = async (email: string, password: string) => {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        localStorage.setItem('algo_token', data.token);
        localStorage.setItem('algo_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
    };

    const register = async (email: string, password: string, name: string, lastname: string) => {
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, lastname }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
    };

    const logout = () => {
        localStorage.removeItem('algo_token');
        localStorage.removeItem('algo_user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};

export const API_URL = API;
