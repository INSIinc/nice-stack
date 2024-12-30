import { Module } from '@nestjs/common';
import { InitService } from './init.service';
import { MinioModule } from '@server/utils/minio/minio.module';
import { AuthModule } from '@server/auth/auth.module';
import { AppConfigModule } from '@server/models/app-config/app-config.module';
import { GenDevService } from './gendev.service';
import { StaffModule } from '@server/models/staff/staff.module';
import { DepartmentModule } from '@server/models/department/department.module';
import { TermModule } from '@server/models/term/term.module';

@Module({
  imports: [MinioModule, AuthModule, AppConfigModule, StaffModule, DepartmentModule, TermModule],
  providers: [InitService, GenDevService],
  exports: [InitService]
})
export class InitModule { }
