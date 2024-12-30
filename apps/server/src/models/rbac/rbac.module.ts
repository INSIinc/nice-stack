import { Module } from '@nestjs/common';
import { RoleMapService } from './rolemap.service';
import { RoleRouter } from './role.router';
import { TrpcService } from '@server/trpc/trpc.service';
import { RoleService } from './role.service';
import { RoleMapRouter } from './rolemap.router';
import { DepartmentModule } from '../department/department.module';

@Module({
  imports: [DepartmentModule],
  providers: [RoleMapService, RoleRouter, TrpcService, RoleService, RoleMapRouter],
  exports: [RoleRouter, RoleService, RoleMapService, RoleMapRouter]
})
export class RoleMapModule { }
