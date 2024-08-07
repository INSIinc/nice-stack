import { QueryClient } from '@tanstack/react-query';
import { unstable_httpBatchStreamLink, loggerLink } from '@trpc/client';
import React, { useState } from 'react';
import { api } from '../utils/trpc';
import superjson from 'superjson';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createIDBPersister } from '../utils/idb';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        api.createClient({

            links: [
                unstable_httpBatchStreamLink({
                    url: 'http://localhost:3000/trpc',
                    // You can pass any HTTP headers you wish here
                    async headers() {
                        return {
                            // authorization: getAuthCookie(),
                        };
                    },
                    transformer: superjson
                }),
                loggerLink({
                    enabled: (opts) =>
                        (process.env.NODE_ENV === 'development' &&
                            typeof window !== 'undefined') ||
                        (opts.direction === 'down' && opts.result instanceof Error),
                }),
            ],
        }),
    );
    return (
        <api.Provider client={trpcClient} queryClient={queryClient}>
            <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: createIDBPersister() }}>
                {children}
            </PersistQueryClientProvider>
        </api.Provider>
    );
}