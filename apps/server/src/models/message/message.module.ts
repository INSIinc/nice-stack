import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageRouter } from './message.router';
import { TrpcService } from '@server/trpc/trpc.service';
import { DepartmentModule } from '../department/department.module';
import { MessageController } from './message.controller';

@Module({
  imports: [DepartmentModule],
  providers: [MessageService, MessageRouter, TrpcService],
  exports: [MessageService, MessageRouter],
  controllers: [MessageController],
})
export class MessageModule { }
