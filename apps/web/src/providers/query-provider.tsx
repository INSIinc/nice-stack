import { QueryClient } from '@tanstack/react-query';
import { unstable_httpBatchStreamLink, loggerLink } from '@trpc/client';
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../utils/trpc';
import superjson from 'superjson';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createIDBPersister } from '../utils/idb';
import { env } from '../env';
import { useAuth } from './auth-provider';
export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    const { accessToken } = useAuth()
    const trpcClient = useMemo(() =>
        api.createClient({
            links: [
                unstable_httpBatchStreamLink({
                    url: `${env.API_URL}/trpc`,
                    headers: async () => ({
                        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                    }),
                    transformer: superjson
                }),
                loggerLink({
                    enabled: (opts) =>
                        (process.env.NODE_ENV === 'development' &&
                            typeof window !== 'undefined') ||
                        (opts.direction === 'down' && opts.result instanceof Error),
                }),
            ],
        }), [accessToken]
    );
    return (
        <api.Provider client={trpcClient} queryClient={queryClient}>
            <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: createIDBPersister() }}>
                {children}
            </PersistQueryClientProvider>
        </api.Provider>
    );
}