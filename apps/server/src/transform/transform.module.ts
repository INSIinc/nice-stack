import { Module } from '@nestjs/common';
import { TransformService } from './transform.service';
import { TransformRouter } from './transform.router';
import { TrpcService } from '@server/trpc/trpc.service';

@Module({
  providers: [TransformService, TransformRouter, TrpcService],
  exports: [TransformRouter]
})
export class TransformModule { }
