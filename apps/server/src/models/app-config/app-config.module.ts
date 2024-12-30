import { Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { TrpcService } from '@server/trpc/trpc.service';
import { AppConfigRouter } from './app-config.router';
import { RealTimeModule } from '@server/socket/realtime/realtime.module';

@Module({
  imports: [RealTimeModule],
  providers: [AppConfigService, AppConfigRouter, TrpcService],
  exports: [AppConfigService, AppConfigRouter]
})
export class AppConfigModule { }
