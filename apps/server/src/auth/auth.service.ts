import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { StaffService } from '../models/staff/staff.service';
import {
  db,
  AuthSchema,
  JwtPayload,
} from '@nicestack/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { redis } from '@server/utils/redis/redis.service';
import { UserProfileService } from './utils';
import { SessionInfo, SessionService } from './session.service';
import { tokenConfig } from './config';
import { z } from 'zod';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name)
  constructor(
    private readonly staffService: StaffService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) { }

  private async generateTokens(payload: JwtPayload): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: `${tokenConfig.accessToken.expirationMs / 1000}s`,
      }),
      this.jwtService.signAsync(
        { sub: payload.sub },
        { expiresIn: `${tokenConfig.refreshToken.expirationMs / 1000}s` },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async signIn(data: z.infer<typeof AuthSchema.signInRequset>): Promise<SessionInfo> {
    const { username, password, phoneNumber } = data;

    let staff = await db.staff.findFirst({
      where: { OR: [{ username }, { phoneNumber }], deletedAt: null },
    });

    if (!staff && phoneNumber) {
      staff = await this.signUp({
        showname: '新用户',
        username: phoneNumber,
        phoneNumber,
        password: phoneNumber,
      });
    } else if (!staff) {
      throw new UnauthorizedException('帐号不存在');
    }
    if (!staff.enabled) {
      throw new UnauthorizedException('帐号已禁用');
    }
    const isPasswordMatch = phoneNumber || await argon2.verify(staff.password, password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('帐号或密码错误');
    }

    try {
      const payload = { sub: staff.id, username: staff.username };
      const { accessToken, refreshToken } = await this.generateTokens(payload);

      return await this.sessionService.createSession(
        staff.id,
        accessToken,
        refreshToken,
        {
          accessTokenExpirationMs: tokenConfig.accessToken.expirationMs,
          refreshTokenExpirationMs: tokenConfig.refreshToken.expirationMs,
          sessionTTL: tokenConfig.accessToken.expirationTTL,
        },
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('创建会话失败');
    }
  }
  async signUp(data: z.infer<typeof AuthSchema.signUpRequest>) {
    const { username, phoneNumber, officerId } = data;

    const existingUser = await db.staff.findFirst({
      where: {
        OR: [{ username }, { officerId }, { phoneNumber }],
        deletedAt: null
      },
    });

    if (existingUser) {
      throw new BadRequestException('帐号或证件号已存在');
    }

    return this.staffService.create({
      data: {
        ...data,
        domainId: data.deptId,
      }
    });
  }
  async refreshToken(data: z.infer<typeof AuthSchema.refreshTokenRequest>) {
    const { refreshToken, sessionId } = data;

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('用户会话已过期');
    }

    const session = await this.sessionService.getSession(payload.sub, sessionId);
    if (!session || session.refresh_token !== refreshToken) {
      throw new UnauthorizedException('用户会话已过期');
    }

    const user = await db.staff.findUnique({ where: { id: payload.sub, deletedAt: null } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const { accessToken } = await this.generateTokens({
      sub: user.id,
      username: user.username,
    });

    const updatedSession = {
      ...session,
      access_token: accessToken,
      access_token_expires_at: Date.now() + tokenConfig.accessToken.expirationMs,
    };
    await this.sessionService.saveSession(
      payload.sub,
      updatedSession,
      tokenConfig.accessToken.expirationTTL,
    );
    await redis.del(UserProfileService.instance.getProfileCacheKey(payload.sub));
    return {
      access_token: accessToken,
      access_token_expires_at: updatedSession.access_token_expires_at,
    };
  }
  async changePassword(data: z.infer<typeof AuthSchema.changePassword>) {
    const { newPassword, phoneNumber, username } = data;
    const user = await db.staff.findFirst({
      where: { OR: [{ username }, { phoneNumber }], deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    await this.staffService.update({
      where: { id: user?.id },
      data: {
        password: newPassword,
      }
    });

    return { message: '密码已修改' };
  }
  async logout(data: z.infer<typeof AuthSchema.logoutRequest>) {
    const { refreshToken, sessionId } = data;

    try {
      const payload = this.jwtService.verify(refreshToken);
      await Promise.all([
        this.sessionService.deleteSession(payload.sub, sessionId),
        redis.del(UserProfileService.instance.getProfileCacheKey(payload.sub)),
      ]);
    } catch {
      throw new UnauthorizedException('无效的会话');
    }

    return { message: '注销成功' };
  }

}