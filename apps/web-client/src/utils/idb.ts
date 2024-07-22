import { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { get, set, del } from 'idb-keyval'
export function createIDBPersister(idbValidKey: IDBValidKey = 'reactQuery') {
    return {
        persistClient: async (client: PersistedClient) => {
            await set(idbValidKey, client)
        },
        restoreClient: async () => {
            return await get<PersistedClient>(idbValidKey)
        },
        removeClient: async () => {
            await del(idbValidKey)
        },
    } as Persister
}