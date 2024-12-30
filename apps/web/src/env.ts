export const env: {
	APP_NAME: string;
	SERVER_IP: string;
	VERSION: string;
} = {
	APP_NAME: import.meta.env.PROD
		? (window as any).env.VITE_APP_APP_NAME
		: import.meta.env.VITE_APP_APP_NAME,
	SERVER_IP: import.meta.env.PROD
		? (window as any).env.VITE_APP_SERVER_IP
		: import.meta.env.VITE_APP_SERVER_IP,
	VERSION: import.meta.env.PROD
		? (window as any).env.VITE_APP_VERSION
		: import.meta.env.VITE_APP_VERSION,
};
