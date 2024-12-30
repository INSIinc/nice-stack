import { Logger, Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { TrpcRouter } from './trpc.router';
import { QueueModule } from '@server/queue/queue.module';
import { DepartmentModule } from '@server/models/department/department.module';
import { StaffModule } from '@server/models/staff/staff.module';
import { TermModule } from '@server/models/term/term.module';
import { TaxonomyModule } from '@server/models/taxonomy/taxonomy.module';
import { AuthModule } from '@server/auth/auth.module';
import { AppConfigModule } from '@server/models/app-config/app-config.module';
import { MessageModule } from '@server/models/message/message.module';
import { PostModule } from '@server/models/post/post.module';
import { VisitModule } from '@server/models/visit/visit.module';
import { WebSocketModule } from '@server/socket/websocket.module';
import { RoleMapModule } from '@server/models/rbac/rbac.module';
import { TransformModule } from '@server/models/transform/transform.module';
@Module({
  imports: [
    AuthModule,
    QueueModule,
    DepartmentModule,
    StaffModule,
    TermModule,
    TaxonomyModule,
    RoleMapModule,
    TransformModule,
    MessageModule,
    AppConfigModule,
    PostModule,
    VisitModule,
    WebSocketModule
  ],
  controllers: [],
  providers: [TrpcService, TrpcRouter, Logger],
})
export class TrpcModule { }
