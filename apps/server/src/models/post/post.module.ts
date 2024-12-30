import { Module } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { DepartmentService } from '@server/models/department/department.service';

import { QueueModule } from '@server/queue/queue.module';
import { MessageModule } from '../message/message.module';
import { PostRouter } from './post.router';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { RoleMapModule } from '../rbac/rbac.module';

@Module({
  imports: [QueueModule, RoleMapModule, MessageModule],
  providers: [PostService, PostRouter, TrpcService, DepartmentService],
  exports: [PostRouter, PostService],
  controllers: [PostController],
})
export class PostModule {}
