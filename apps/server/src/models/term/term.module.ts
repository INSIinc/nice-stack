import { Module } from '@nestjs/common';
import { TermService } from './term.service';
import { TermRouter } from './term.router';
import { TrpcService } from '@server/trpc/trpc.service';
import { DepartmentModule } from '../department/department.module';
import { RbacModule } from '@server/rbac/rbac.module';
import { RelationService } from '@server/relation/relation.service';


@Module({
    imports: [DepartmentModule, RbacModule],
    providers: [TermService, TermRouter, TrpcService, RelationService],
    exports: [TermService, TermRouter]
})
export class TermModule { }
