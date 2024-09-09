import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { env } from '@server/env';
import { AuthController } from './auth.controller';
import { StaffService } from '@server/models/staff/staff.service';
import { RoleMapService } from '@server/rbac/rolemap.service';
import { DepartmentService } from '@server/models/department/department.service';

@Module({
  providers: [AuthService, StaffService, RoleMapService,DepartmentService],
  imports: [JwtModule.register({
    global: true,
    secret: env.JWT_SECRET,
    signOptions: { expiresIn: '60s' },
  }),],
  controllers: [AuthController]
})
export class AuthModule { }
