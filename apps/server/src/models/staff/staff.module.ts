import { Module } from '@nestjs/common';
import { StaffRouter } from './staff.router';
import { StaffService } from './staff.service';
import { TrpcService } from '@server/trpc/trpc.service';
import { DepartmentService } from '../department/department.service';

@Module({
    providers: [StaffRouter, StaffService, TrpcService, DepartmentService],
    exports: [StaffRouter, StaffService]
})
export class StaffModule { }
