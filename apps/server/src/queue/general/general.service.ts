import axios, { AxiosInstance } from 'axios';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeneralService {
    private axiosInstance: AxiosInstance;
    private logger: Logger;

    constructor() {
        const PYTHON_ENDPOINT = process.env.PYTHON_URL || 'http://localhost:8000';
        this.logger = new Logger(GeneralService.name);
        this.axiosInstance = axios.create({
            baseURL: PYTHON_ENDPOINT,
            timeout: 120000, // 设置请求超时时间
        });
    }
}
