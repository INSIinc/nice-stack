import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { StaffModule } from '@server/models/staff/staff.module';
import { AuthRouter } from './auth.router';
import { TrpcService } from '@server/trpc/trpc.service';
import { DepartmentService } from '@server/models/department/department.service';
import { SessionService } from './session.service';
import { RoleMapModule } from '@server/models/rbac/rbac.module';

@Module({
  imports: [StaffModule, RoleMapModule],
  providers: [AuthService, AuthRouter, TrpcService, DepartmentService, SessionService],
  exports: [AuthRouter, AuthService],
  controllers: [AuthController],
})
export class AuthModule { }
