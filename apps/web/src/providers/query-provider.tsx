import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	wsLink,
	loggerLink,
	httpBatchLink,
	createWSClient,
	splitLink,
} from "@trpc/client";
import { api } from "@nicestack/client"
import { useEffect, useMemo, useState } from "react";
import superjson from "superjson";
import { useAuth } from "./auth-provider";
import { useLocalSettings } from "../hooks/useLocalSetting";
export default function QueryProvider({ children }) {
	const { accessToken } = useAuth();
	const { apiUrl, websocketUrl } = useLocalSettings();
	// Set the default query options including staleTime.
	const [queryClient] = useState(() => new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60 * 10, // 5 minutes
			},
		},
	}));
	// 使用useEffect来延迟设置isReady
	const wsClient = useMemo(() => {
		return createWSClient({
			url: `${websocketUrl}/trpc`,
			connectionParams: accessToken ? {
				token: accessToken
			} : {}
		});
	}, [websocketUrl, accessToken]);

	useEffect(() => {
		return () => {
			if (wsClient) {
				wsClient.close();
			}
		};
	}, []);

	const trpcClient = useMemo(() => {
		const headers = async () => ({
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
		});

		const links = [
			splitLink({
				condition: (operation) => operation.type === "subscription",
				true: wsClient ? wsLink({
					client: wsClient,
					transformer: superjson,
				}) : httpBatchLink({
					url: `${apiUrl}/trpc`,
					headers,
					transformer: superjson,
				}),
				false: httpBatchLink({
					url: `${apiUrl}/trpc`,
					headers,
					transformer: superjson,
				}),
			}),
			loggerLink({
				enabled: (opts) =>
					(import.meta.env.DEV && typeof window !== "undefined") ||
					(opts.direction === "down" && opts.result instanceof Error),
			}),
		];

		return api.createClient({
			links,
		});
	}, [accessToken, wsClient, apiUrl]);

	return (
		<api.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		</api.Provider>
	);
}
