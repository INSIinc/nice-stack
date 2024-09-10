import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthSchema, db, z } from '@nicestack/common';
import { StaffService } from '@server/models/staff/staff.service';
import { JwtPayload } from '@nicestack/common';
import { RoleMapService } from '@server/rbac/rolemap.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly staffService: StaffService,
    private readonly roleMapService: RoleMapService
  ) { }

  async signIn(data: z.infer<typeof AuthSchema.signInRequset>) {
    const { username, password, phoneNumber } = data;
    // Find the staff by either username or phoneNumber
    const staff = await db.staff.findFirst({
      where: {
        OR: [
          { username },
          { phoneNumber }
        ]
      }
    });

    if (!staff) {
      throw new UnauthorizedException('Invalid username/phone number or password');
    }

    const isPasswordMatch = await bcrypt.compare(password, staff.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid username/phone number or password');
    }

    const payload: JwtPayload = { sub: staff.id, username: staff.username };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '1h' });
    const refreshToken = await this.generateRefreshToken(staff.id);

    // Calculate expiration dates
    const accessTokenExpiresAt = new Date();
    accessTokenExpiresAt.setHours(accessTokenExpiresAt.getHours() + 1);

    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

    // Store the refresh token in the database
    await db.refreshToken.create({
      data: {
        staffId: staff.id,
        token: refreshToken,
      },
    });

    return {
      access_token: accessToken,
      access_token_expires_at: accessTokenExpiresAt,
      refresh_token: refreshToken,
      refresh_token_expires_at: refreshTokenExpiresAt,
    };
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    return this.jwtService.signAsync(payload, { expiresIn: '7d' }); // Set an appropriate expiration
  }

  async refreshToken(data: z.infer<typeof AuthSchema.refreshTokenRequest>) {
    const { refreshToken } = data;

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await db.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await db.staff.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = await this.jwtService.signAsync(
      { sub: user.id, username: user.username },
      { expiresIn: '1h' },
    );

    // Calculate new expiration date
    const accessTokenExpiresAt = new Date();
    accessTokenExpiresAt.setHours(accessTokenExpiresAt.getHours() + 1);

    return {
      access_token: newAccessToken,
      access_token_expires_at: accessTokenExpiresAt,
    };
  }

  async signUp(data: z.infer<typeof AuthSchema.signUpRequest>) {
    const { username, password, phoneNumber } = data;

    const existingUserByUsername = await db.staff.findUnique({ where: { username } });
    if (existingUserByUsername) {
      throw new BadRequestException('Username is already taken');
    }
    if (phoneNumber) {
      const existingUserByPhoneNumber = await db.staff.findUnique({ where: { phoneNumber } });
      if (existingUserByPhoneNumber) {
        throw new BadRequestException('Phone number is already taken');
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const staff = await this.staffService.create({
      username,
      phoneNumber,
      password: hashedPassword,
    });

    return staff;
  }
  async logout(data: z.infer<typeof AuthSchema.logoutRequest>) {
    const { refreshToken } = data;
    await db.refreshToken.deleteMany({ where: { token: refreshToken } });
    return { message: 'Logout successful' };
  }

  async changePassword(data: z.infer<typeof AuthSchema.changePassword>) {
    const { oldPassword, newPassword, username } = data;
    const user = await db.staff.findUnique({ where: { username } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.staffService.update({ id: user.id, password: hashedNewPassword });

    return { message: 'Password successfully changed' };
  }
  async getUserProfile(data: JwtPayload) {
    const { sub } = data
    const staff = await db.staff.findUnique({
      where: { id: sub }, include: {
        department: true,
        domain: true
      }
    })
    const staffPerms = await this.roleMapService.getPermsForObject({
      domainId: staff.domainId,
      staffId: staff.id,
      deptId: staff.deptId,
    });
    return { ...staff, permissions: staffPerms }
  }
}
