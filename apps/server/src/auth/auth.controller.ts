import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthSchema, JwtPayload } from '@nicestack/common';
import { z } from '@nicestack/common';
import { AuthGuard } from './auth.guard';
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }
    @UseGuards(AuthGuard)
    @Get("user-profile")
    async getUserProfile(@Req() request: Request) {
        const user: JwtPayload = (request as any).user
        return this.authService.getUserProfile(user)
    }
    @Post('login')
    async login(@Body() body: z.infer<typeof AuthSchema.signInRequset>) {
        return this.authService.signIn(body);
    }
    @Post('signup')
    async signup(@Body() body: z.infer<typeof AuthSchema.signUpRequest>) {
        return this.authService.signUp(body);
    }
    @UseGuards(AuthGuard) // Protecting the refreshToken endpoint with AuthGuard
    @Post('refresh-token')
    async refreshToken(@Body() body: z.infer<typeof AuthSchema.refreshTokenRequest>) {
        return this.authService.refreshToken(body);
    }
    @UseGuards(AuthGuard) // Protecting the logout endpoint with AuthGuard
    @Post('logout')
    async logout(@Body() body: z.infer<typeof AuthSchema.logoutRequest>) {
        return this.authService.logout(body);
    }
    @UseGuards(AuthGuard) // Protecting the changePassword endpoint with AuthGuard
    @Post('change-password')
    async changePassword(@Body() body: z.infer<typeof AuthSchema.changePassword>) {
        return this.authService.changePassword(body);
    }
}
