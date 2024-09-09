export const env: {
    TUS_URL: string;
    API_URL: string;
} = {
    TUS_URL:
        import.meta.env.PROD
            ? (window as any).env.VITE_APP_TUS_URL
            : import.meta.env.VITE_APP_TUS_URL,
    API_URL:
        import.meta.env.PROD
            ? (window as any).env.VITE_APP_API_URL
            : import.meta.env.VITE_APP_API_URL,
};
