import { Module } from '@nestjs/common';
import { InitService } from './init.service';
import { AuthModule } from '@server/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [InitService],
  exports: [InitService]
})
export class InitModule { }
