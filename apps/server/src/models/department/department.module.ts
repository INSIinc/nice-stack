import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentRouter } from './department.router';
import { TrpcService } from '@server/trpc/trpc.service';

@Module({
    providers: [DepartmentService, DepartmentRouter, TrpcService],
    exports: [DepartmentService, DepartmentRouter]
})
export class DepartmentModule { }
