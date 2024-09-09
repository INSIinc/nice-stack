import axios from 'axios';
import { env } from '../env';
const BASE_URL = env.API_URL; // Replace with your backend URL
const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
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
