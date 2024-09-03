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

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly staffService: StaffService,
    ) { }
    async signIn(data: z.infer<typeof AuthSchema.signInRequset>) {
        const { username, password } = data;
        const staff = await db.staff.findUnique({ where: { username } });
        if (!staff) {
            throw new UnauthorizedException('Invalid username or password');
        }
        const isPasswordMatch = await bcrypt.compare(password, staff.password);

        if (!isPasswordMatch) {
            throw new UnauthorizedException('Invalid username or password');
        }

        const payload = { sub: staff.id, username: staff.username };
        const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '1h' });
        const refreshToken = await this.generateRefreshToken(staff.id);

        // Store the refresh token in the database
        await db.refreshToken.create({
            data: {
                staffId: staff.id,
                token: refreshToken,
            },
        });
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }

    async generateRefreshToken(userId: string): Promise<string> {
        const payload = { sub: userId };
        return this.jwtService.signAsync(payload, { expiresIn: '7d' }); // Set an appropriate expiration
    }

    async refreshToken(data: z.infer<typeof AuthSchema.refreshTokenRequest>) {
        const { refreshToken } = data;
        let payload;
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

        return {
            access_token: newAccessToken,
        };
    }

    async signUp(data: z.infer<typeof AuthSchema.signUpRequest>) {
        const { username, password } = data;
        const existingUser = await db.staff.findUnique({ where: { username } });

        if (existingUser) {
            throw new BadRequestException('Username is already taken');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const staff = await this.staffService.create({
            username,
            password: hashedPassword,
        });

        return staff
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
}
