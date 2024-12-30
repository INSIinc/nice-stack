export const tokenConfig = {
    accessToken: {
        expirationMs: 7 * 24 * 3600000, // 7 days
        expirationTTL: 7 * 24 * 60 * 60, // 7 days in seconds
    },
    refreshToken: {
        expirationMs: 30 * 24 * 3600000, // 30 days
    },
};