export interface TokenConfig {
    accessToken: {
        expirationMs: number;
        expirationTTL: number;
    };
    refreshToken: {
        expirationMs: number;
    };
}
