import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { env } from '@server/env';

@Module({
  providers: [AuthService],
  imports: [JwtModule.register({
    global: true,
    secret: env.JWT_SECRET,
    signOptions: { expiresIn: '60s' },
  }),]
})
export class AuthModule { }
