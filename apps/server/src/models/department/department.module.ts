import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentRouter } from './department.router';
import { TrpcService } from '@server/trpc/trpc.service';
import { DepartmentController } from './department.controller';
import { DepartmentRowService } from './department.row.service';

@Module({
    providers: [DepartmentService, DepartmentRouter, DepartmentRowService, TrpcService],
    exports: [DepartmentService, DepartmentRouter],
    controllers: [DepartmentController],
})
export class DepartmentModule { }
