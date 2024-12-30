
import { useCallback, useMemo } from "react";
import { env } from "../env";
export function useLocalSettings() {
    const getBaseUrl = useCallback((protocol: string, port: number) => {
        return `${protocol}://${env.SERVER_IP}:${port}`;
    }, []);
    const tusUrl = useMemo(() => getBaseUrl('http', 8080), [getBaseUrl]);
    const apiUrl = useMemo(() => getBaseUrl('http', 3000), [getBaseUrl]);
    const websocketUrl = useMemo(() => getBaseUrl('ws', 3000), [getBaseUrl]);
    const checkIsTusUrl = useCallback((url: string) => {
        return url.startsWith(tusUrl)
    }, [tusUrl])
    return {
        apiUrl, websocketUrl, checkIsTusUrl, tusUrl
    }
}