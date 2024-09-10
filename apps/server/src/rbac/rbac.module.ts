import { Module } from '@nestjs/common';
import { RoleMapService } from './rolemap.service';
import { RoleRouter } from './role.router';
import { TrpcService } from '@server/trpc/trpc.service';
import { RoleService } from './role.service';
import { RoleMapRouter } from './rolemap.router';
import { DepartmentModule } from '@server/models/department/department.module';
import { RolePermsService } from './roleperms.service';
import { RelationService } from '@server/relation/relation.service';

@Module({
  imports: [DepartmentModule],
  providers: [RoleMapService, RoleRouter, TrpcService, RoleService, RoleMapRouter, RolePermsService, RelationService],
  exports: [RoleRouter, RoleService, RoleMapService, RoleMapRouter, RolePermsService]
})
export class RbacModule { }
