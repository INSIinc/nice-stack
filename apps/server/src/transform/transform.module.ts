import { Module } from '@nestjs/common';
import { TransformService } from './transform.service';
import { TransformRouter } from './transform.router';
import { TrpcService } from '@server/trpc/trpc.service';
import { DepartmentModule } from '@server/models/department/department.module';
import { StaffModule } from '@server/models/staff/staff.module';
import { TaxonomyModule } from '@server/models/taxonomy/taxonomy.module';
import { TermModule } from '@server/models/term/term.module';

@Module({
  imports: [DepartmentModule, StaffModule, TaxonomyModule, TermModule],
  providers: [TransformService, TransformRouter, TrpcService],
  exports: [TransformRouter]
})
export class TransformModule { }
