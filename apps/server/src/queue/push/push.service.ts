import { Injectable, InternalServerErrorException, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
interface LoginResponse {
    retcode: string;
    message: string;
    authtoken?: string;
}

interface MessagePushResponse {
    retcode: string;
    message: string;
    messageid?: string;
}

interface Notification {
    title: string; // 通知标题（不超过128字节） / Title of notification (upper limit is 128 bytes)
    content?: string; // 通知内容（不超过256字节） / Content of notification (upper limit is 256 bytes)
    click_action?: {
        url?: string; // 点击通知栏消息，打开指定的URL地址 / URL to open when notification is clicked
        intent?: string; // 点击通知栏消息，用户收到通知栏消息后点击通知栏消息打开应用定义的这个Intent页面 / Intent page to open in the app when notification is clicked
    };
}

interface Option {
    key: string;
    value: string;
}

export interface MessageContent {
    data: Notification;
    option?: Option;
}

@Injectable()
export class PushService {
    private readonly baseURL = process.env.PUSH_URL;
    private readonly appid = process.env.PUSH_APPID;
    private readonly appsecret = process.env.PUSH_APPSECRET;
    private authToken: string | null = null;
    async login(): Promise<LoginResponse> {
        if (this.authToken) {
            return { retcode: '200', message: 'Already logged in', authtoken: this.authToken };
        }
        const url = `${this.baseURL}/push/1.0/login`;
        const response: AxiosResponse<LoginResponse> = await axios.post(url, {
            appid: this.appid,
            appsecret: this.appsecret,
        });
        this.handleError(response.data.retcode);

        this.authToken = response.data.authtoken;
        return response.data;
    }

    async messagePush(
        registerToken: string,
        messageContent: MessageContent,
    ): Promise<MessagePushResponse> {
        if (!this.authToken) {
            await this.login();
        }
        const url = `${this.baseURL}/push/1.0/messagepush`;
        const payload = {
            appid: this.appid,
            appsecret: this.appsecret,
            authtoken: this.authToken,
            registertoken: registerToken,
            messagecontent: JSON.stringify(messageContent),
        };
        const response: AxiosResponse<MessagePushResponse> = await axios.post(url, payload);
        this.handleError(response.data.retcode);
        return response.data;
    }

    private handleError(retcode: string): void {
        switch (retcode) {
            case '000':
            case '200':
                return;
            case '001':
                throw new BadRequestException('JID is illegal');
            case '002':
                throw new BadRequestException('AppID is illegal');
            case '003':
                throw new BadRequestException('Protoversion is mismatch');
            case '010':
                throw new BadRequestException('The application of AppID Token is repeated');
            case '011':
                throw new BadRequestException('The number of applications for token exceeds the maximum');
            case '012':
                throw new BadRequestException('Token is illegal');
            case '013':
                throw new UnauthorizedException('Integrity check failed');
            case '014':
                throw new BadRequestException('Parameter is illegal');
            case '015':
                throw new InternalServerErrorException('Internal error');
            case '202':
                throw new UnauthorizedException('You are already logged in');
            case '205':
                return;
            case '500':
                throw new InternalServerErrorException('Internal Server Error');
            case '502':
                throw new InternalServerErrorException('Session loading error');
            case '503':
                throw new InternalServerErrorException('Service Unavailable');
            case '504':
                throw new NotFoundException('Parameters not found');
            case '505':
                throw new BadRequestException('Parameters are empty or not as expected');
            case '506':
                throw new InternalServerErrorException('Database error');
            case '508':
                throw new InternalServerErrorException('NoSuchAlgorithmException');
            case '509':
                throw new UnauthorizedException('Authentication Failed');
            case '510':
                throw new UnauthorizedException('Illegal token... client does not exist');
            default:
                throw new InternalServerErrorException('Unexpected error occurred');
        }
    }
}
