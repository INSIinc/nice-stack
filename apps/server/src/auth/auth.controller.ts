import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthSchema, JwtPayload } from '@nicestack/common';
import { AuthGuard } from './auth.guard';
import { UserProfileService } from './utils';
import { z } from 'zod';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  @UseGuards(AuthGuard)
  @Get('user-profile')
  async getUserProfile(@Req() request: Request) {
    const payload: JwtPayload = (request as any).user;
    const { staff } = await UserProfileService.instance.getUserProfileById(payload.sub);
    return staff
  }
  @Post('login')
  async login(@Body() body: z.infer<typeof AuthSchema.signInRequset>) {
    return this.authService.signIn(body);
  }
  @Post('signup')
  async signup(@Body() body: z.infer<typeof AuthSchema.signUpRequest>) {
    return this.authService.signUp(body);
  }
  @Post('refresh-token')
  async refreshToken(
    @Body() body: z.infer<typeof AuthSchema.refreshTokenRequest>,
  ) {
    return this.authService.refreshToken(body);
  }
  // @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Body() body: z.infer<typeof AuthSchema.logoutRequest>) {
    return this.authService.logout(body);
  }
  @UseGuards(AuthGuard) // Protecting the changePassword endpoint with AuthGuard
  @Post('change-password')
  async changePassword(
    @Body() body: z.infer<typeof AuthSchema.changePassword>,
  ) {
    return this.authService.changePassword(body);
  }
}
