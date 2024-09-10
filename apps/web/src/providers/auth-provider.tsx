import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import apiClient from '../utils/axios-client';
import { UserProfile } from '@nicestack/common';

interface AuthContextProps {
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    user: UserProfile | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshAccessToken: () => Promise<void>;
    initializeAuth: () => void;
    startTokenRefreshInterval: () => void;
    fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth(): AuthContextProps {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('access_token'));
    const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refresh_token'));
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('access_token'));
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [user, setUser] = useState<UserProfile | null>(JSON.parse(localStorage.getItem('user_profile') || 'null'));

    const initializeAuth = useCallback(() => {
        const storedAccessToken = localStorage.getItem('access_token');
        const storedRefreshToken = localStorage.getItem('refresh_token');
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setIsAuthenticated(!!storedAccessToken);
        if (storedRefreshToken) {
            startTokenRefreshInterval();
        }
        if (storedAccessToken) {
            fetchUserProfile();
        }
    }, []);

    const refreshAccessToken = useCallback(async () => {
        if (!refreshToken) return;
        try {
            setIsLoading(true);
            const response = await apiClient.post(`/auth/refresh-token`, { refreshToken });
            const { access_token, access_token_expires_at } = response.data;
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('access_token_expires_at', access_token_expires_at);
            setAccessToken(access_token);
            setIsAuthenticated(true);
            fetchUserProfile();
        } catch (err) {
            console.error("Token refresh failed", err);
            logout();
        } finally {
            setIsLoading(false);
        }
    }, [refreshToken]);

    const startTokenRefreshInterval = useCallback(async () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
        await refreshAccessToken();
        const newIntervalId = setInterval(refreshAccessToken, 10 * 60 * 1000); // 10 minutes
        setIntervalId(newIntervalId);
    }, [intervalId, refreshAccessToken]);

    const login = async (username: string, password: string): Promise<void> => {
        try {
            setIsLoading(true);
            const response = await apiClient.post(`/auth/login`, { username, password });
            const { access_token, refresh_token, access_token_expires_at, refresh_token_expires_at } = response.data;
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            localStorage.setItem('access_token_expires_at', access_token_expires_at);
            localStorage.setItem('refresh_token_expires_at', refresh_token_expires_at);
            setAccessToken(access_token);
            setRefreshToken(refresh_token);
            setIsAuthenticated(true);
            startTokenRefreshInterval();
            fetchUserProfile();
        } catch (err) {
            console.error("Login failed", err);
            throw new Error("Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            setIsLoading(true);
            const storedRefreshToken = localStorage.getItem('refresh_token');
            await apiClient.post(`/auth/logout`, { refreshToken: storedRefreshToken });

            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('access_token_expires_at');
            localStorage.removeItem('refresh_token_expires_at');
            localStorage.removeItem('user_profile');

            setAccessToken(null);
            setRefreshToken(null);
            setIsAuthenticated(false);
            setUser(null);

            if (intervalId) {
                clearInterval(intervalId);
                setIntervalId(null);
            }
        } catch (err) {
            console.error("Logout failed", err);
            throw new Error("Logout failed");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserProfile = useCallback(async () => {
        try {
            const response = await apiClient.get(`/auth/user-profile`);
            const userProfile = response.data;
            setUser(userProfile);
            localStorage.setItem('user_profile', JSON.stringify(userProfile));
        } catch (err) {
            console.error("Fetching user profile failed", err);
        }
    }, []);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const value: AuthContextProps = {
        accessToken,
        refreshToken,
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        refreshAccessToken,
        initializeAuth,
        startTokenRefreshInterval,
        fetchUserProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
