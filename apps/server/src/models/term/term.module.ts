import { Module } from '@nestjs/common';
import { TermService } from './term.service';
import { TermRouter } from './term.router';
import { TrpcService } from '@server/trpc/trpc.service';
import { DepartmentModule } from '../department/department.module';
import { TermController } from './term.controller';
import { RoleMapModule } from '../rbac/rbac.module';
import { TermRowService } from './term.row.service';

@Module({
  imports: [DepartmentModule, RoleMapModule],
  providers: [TermService, TermRouter, TrpcService, TermRowService],
  exports: [TermService, TermRouter],
  controllers: [TermController],
})
export class TermModule { }
