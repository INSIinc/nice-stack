import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { TrpcRouter } from './trpc.router';
import { DepartmentRouter } from '@server/models/department/department.router';
import { TransformRouter } from '@server/transform/transform.router';
import { StaffRouter } from '@server/models/staff/staff.router';
import { StaffModule } from '../models/staff/staff.module';
import { DepartmentModule } from '@server/models/department/department.module';
import { TransformModule } from '@server/transform/transform.module';

@Module({
  imports: [StaffModule, DepartmentModule, TransformModule],
  controllers: [],
  providers: [TrpcService, TrpcRouter],
})
export class TrpcModule { }

