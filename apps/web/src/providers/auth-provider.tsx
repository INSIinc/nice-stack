import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	ReactNode,
} from "react";
import apiClient from "../utils/axios-client";
import { AuthSchema, RolePerms, UserProfile } from "@nicestack/common";
import { z } from "zod";
interface AuthContextProps {
	accessToken: string | null;
	refreshToken: string | null;
	isAuthenticated: boolean;
	sessionId: string | null;
	isLoading: boolean;
	user: UserProfile | null;
	isRoot: boolean | null;
	login: (username: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	signup: (data: z.infer<typeof AuthSchema.signUpRequest>) => Promise<void>;
	refreshAccessToken: () => Promise<void>;
	initializeAuth: () => void;
	startTokenRefreshInterval: () => void;
	fetchUserProfile: () => Promise<void>;
	hasSomePermissions: (...permissions: string[]) => boolean;
	hasEveryPermissions: (...permissions: string[]) => boolean;
	isSameDomain: (deptId: string) => boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth(): AuthContextProps {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [accessToken, setAccessToken] = useState<string | null>(
		localStorage.getItem("access_token")
	);
	const [sessionId, setSessionId] = useState<string | null>(
		localStorage.getItem("session_id")
	);
	const [refreshToken, setRefreshToken] = useState<string | null>(
		localStorage.getItem("refresh_token")
	);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
		!!localStorage.getItem("access_token")
	);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
	const [user, setUser] = useState<UserProfile | null>(
		JSON.parse(localStorage.getItem("user-profile") || "null")
	);
	const [isRoot, setIsRoot] = useState<boolean>(false);
	const initializeAuth = useCallback(() => {
		const storedAccessToken = localStorage.getItem("access_token");
		const storedRefreshToken = localStorage.getItem("refresh_token");
		const storedSessionId = localStorage.getItem("session_id");
		setAccessToken(storedAccessToken);
		setRefreshToken(storedRefreshToken);
		setSessionId(storedSessionId);
		setIsAuthenticated(!!storedAccessToken);
		if (storedRefreshToken && storedSessionId) {
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
			const response = await apiClient.post(`/auth/refresh-token`, {
				refreshToken,
				sessionId,
			});
			const { access_token, access_token_expires_at } = response.data;
			localStorage.setItem("access_token", access_token);
			localStorage.setItem(
				"access_token_expires_at",
				access_token_expires_at
			);
			setAccessToken(access_token);
			setIsAuthenticated(true);
			fetchUserProfile();
		} catch (err: any) {
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
		const newIntervalId = setInterval(refreshAccessToken, 60 * 60 * 1000);
		setIntervalId(newIntervalId);
	}, [intervalId, refreshAccessToken]);

	const login = async (username: string, password: string): Promise<void> => {
		try {
			setIsLoading(true);
			const response = await apiClient.post(`/auth/login`, {
				username,
				password,
			});
			const {
				access_token,
				refresh_token,
				access_token_expires_at,
				refresh_token_expires_at,
				session_id,
			} = response.data;
			localStorage.setItem("access_token", access_token);
			localStorage.setItem("refresh_token", refresh_token);
			localStorage.setItem("session_id", session_id);
			localStorage.setItem(
				"access_token_expires_at",
				access_token_expires_at
			);
			localStorage.setItem(
				"refresh_token_expires_at",
				refresh_token_expires_at
			);
			setAccessToken(access_token);
			setRefreshToken(refresh_token);
			setSessionId(session_id);
			setIsAuthenticated(true);
			startTokenRefreshInterval();
			fetchUserProfile();
		} catch (err: any) {
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	const signup = async (
		data: z.infer<typeof AuthSchema.signUpRequest>
	): Promise<void> => {
		try {
			setIsLoading(true);
			await apiClient.post(`/auth/signup`, data);
		} catch (err: any) {
			throw err;
		} finally {
			setIsLoading(false);
		}
	};
	useEffect(() => {
		if (user)
			setIsRoot(user.permissions.includes(RolePerms.MANAGE_ANY_STAFF));
	}, [user]);
	const logout = async (): Promise<void> => {
		try {
			setIsLoading(true);
			const storedRefreshToken = localStorage.getItem("refresh_token");
			const storedSessionId = localStorage.getItem("session_id");
			localStorage.removeItem("session_id");
			localStorage.removeItem("refresh_token");
			localStorage.removeItem("access_token_expires_at");
			localStorage.removeItem("refresh_token_expires_at");
			localStorage.removeItem("user-profile");
			localStorage.removeItem("access_token");
			// localStorage.clear()
			await apiClient.post(`/auth/logout`, {
				refreshToken: storedRefreshToken,
				sessionId: storedSessionId,
			});

			setAccessToken(null);
			setRefreshToken(null);
			setSessionId(null);
			setIsAuthenticated(false);
			setUser(null);
			setIsRoot(false);
			if (intervalId) {
				clearInterval(intervalId);
				setIntervalId(null);
			}
		} catch (err: any) {
			console.error("Logout failed", err);
		} finally {
			setIsLoading(false);
			window.location.reload();
		}
	};

	const fetchUserProfile = useCallback(async () => {
		try {
			const response = await apiClient.get(`/auth/user-profile`);
			const userProfile = response.data;
			setUser(userProfile);

			localStorage.setItem("user-profile", JSON.stringify(userProfile));
		} catch (err: any) {
			console.error(err);
		}
	}, []);
	useEffect(() => {
		initializeAuth();
	}, [initializeAuth]);
	const hasSomePermissions = (...permissions: string[]) => {
		return permissions.some((perm) =>
			user?.permissions?.includes(perm as RolePerms)
		);
	};
	const hasEveryPermissions = (...permissions: string[]) => {
		return permissions.every((perm) =>
			user?.permissions.includes(perm as RolePerms)
		);
	};
	const isSameDomain = (deptId: string) => {
		return user?.domainId === deptId;
	};
	const value: AuthContextProps = {
		hasSomePermissions,
		hasEveryPermissions,
		accessToken,
		isSameDomain,
		refreshToken,
		isAuthenticated,
		isLoading,
		user,
		isRoot,
		login,
		logout,
		signup,
		refreshAccessToken,
		initializeAuth,
		startTokenRefreshInterval,
		fetchUserProfile,
		sessionId,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}
