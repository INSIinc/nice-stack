import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { TrpcRouter } from './trpc.router';
import { HelloService } from '@server/hello/hello.service';
import { HelloRouter } from '@server/hello/hello.router';

@Module({
  imports: [],
  controllers: [],
  providers: [TrpcService, TrpcRouter, HelloRouter, HelloService],
})
export class TrpcModule { }

