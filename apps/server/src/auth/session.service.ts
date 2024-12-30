// session.service.ts
import { Injectable } from '@nestjs/common';
import { redis } from '@server/utils/redis/redis.service';
import { v4 as uuidv4 } from 'uuid';

export interface SessionInfo {
    session_id: string;
    access_token: string;
    access_token_expires_at: number;
    refresh_token: string;
    refresh_token_expires_at: number;
}

@Injectable()
export class SessionService {
    private getSessionKey(userId: string, sessionId: string): string {
        return `session-${userId}-${sessionId}`;
    }
    async createSession(
        userId: string,
        accessToken: string,
        refreshToken: string,
        expirationConfig: {
            accessTokenExpirationMs: number;
            refreshTokenExpirationMs: number;
            sessionTTL: number;
        },
    ): Promise<SessionInfo> {
        const sessionInfo: SessionInfo = {
            session_id: uuidv4(),
            access_token: accessToken,
            access_token_expires_at: Date.now() + expirationConfig.accessTokenExpirationMs,
            refresh_token: refreshToken,
            refresh_token_expires_at: Date.now() + expirationConfig.refreshTokenExpirationMs,
        };

        await this.saveSession(userId, sessionInfo, expirationConfig.sessionTTL);
        return sessionInfo;
    }

    async getSession(userId: string, sessionId: string): Promise<SessionInfo | null> {
        const sessionData = await redis.get(this.getSessionKey(userId, sessionId));
        return sessionData ? JSON.parse(sessionData) : null;
    }

    async saveSession(
        userId: string,
        sessionInfo: SessionInfo,
        ttl: number,
    ): Promise<void> {
        await redis.setex(
            this.getSessionKey(userId, sessionInfo.session_id),
            ttl,
            JSON.stringify(sessionInfo),
        );
    }

    async deleteSession(userId: string, sessionId: string): Promise<void> {
        await redis.del(this.getSessionKey(userId, sessionId));
    }
}