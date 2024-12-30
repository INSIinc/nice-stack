import axios from 'axios';
import { env } from '../env';
const BASE_URL = `http://${env.SERVER_IP}:3000`
const apiClient = axios.create({
    baseURL: BASE_URL,
    // withCredentials: true,
});
// Add a request interceptor to attach the access token
apiClient.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default apiClient;
