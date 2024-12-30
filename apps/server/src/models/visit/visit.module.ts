import { Module } from '@nestjs/common';
import { VisitService } from './visit.service';
import { VisitRouter } from './visit.router';
import { TrpcService } from '@server/trpc/trpc.service';

@Module({
  providers: [VisitService, VisitRouter, TrpcService],
  exports: [VisitRouter]
})
export class VisitModule { }
