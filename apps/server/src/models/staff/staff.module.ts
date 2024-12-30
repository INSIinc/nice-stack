import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffRouter } from './staff.router';
import { TrpcService } from '@server/trpc/trpc.service';
import { DepartmentModule } from '../department/department.module';
import { StaffController } from './staff.controller';
import { StaffRowService } from './staff.row.service';

@Module({
  imports: [DepartmentModule],
  providers: [StaffService, StaffRouter, TrpcService, StaffRowService],
  exports: [StaffService, StaffRouter, StaffRowService],
  controllers: [StaffController],
})
export class StaffModule { }
