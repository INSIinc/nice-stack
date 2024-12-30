import { Module } from '@nestjs/common';
import { TransformRouter } from './transform.router';
import { TransformService } from './transform.service';
import { TermModule } from '@server/models/term/term.module';
import { TaxonomyModule } from '@server/models/taxonomy/taxonomy.module';
import { TrpcService } from '@server/trpc/trpc.service';
import { DepartmentModule } from '../department/department.module';
import { StaffModule } from '../staff/staff.module';
// import { TransformController } from './transform.controller';
@Module({
  imports: [
    DepartmentModule,
    StaffModule,
    TermModule,
    TaxonomyModule,
  ],
  providers: [TransformService, TransformRouter, TrpcService],
  exports: [TransformRouter, TransformService],
  // controllers:[TransformController]
})
export class TransformModule {}
