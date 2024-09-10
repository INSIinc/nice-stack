import { Module } from '@nestjs/common';
import { InitService } from './init.service';
import { AuthModule } from '@server/auth/auth.module';
import { MinioModule } from '@server/minio/minio.module';

@Module({
  imports: [AuthModule, MinioModule],
  providers: [InitService],
  exports: [InitService]
})
export class InitModule { }
