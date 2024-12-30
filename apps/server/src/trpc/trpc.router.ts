import { INestApplication, Injectable, Logger } from '@nestjs/common';
import { DepartmentRouter } from '@server/models/department/department.router';
import { StaffRouter } from '@server/models/staff/staff.router';
import { TaxonomyRouter } from '@server/models/taxonomy/taxonomy.router';
import { TermRouter } from '@server/models/term/term.router';
import { TrpcService } from '@server/trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';
import { AuthRouter } from '@server/auth/auth.router';
import ws, { WebSocketServer } from 'ws';
import { AppConfigRouter } from '@server/models/app-config/app-config.router';
import { MessageRouter } from '@server/models/message/message.router';
import { PostRouter } from '@server/models/post/post.router';
import { VisitRouter } from '@server/models/visit/visit.router';
import { RoleMapRouter } from '@server/models/rbac/rolemap.router';
import { TransformRouter } from '@server/models/transform/transform.router';
import { RoleRouter } from '@server/models/rbac/role.router';
@Injectable()
export class TrpcRouter {
  logger = new Logger(TrpcRouter.name)
  constructor(
    private readonly trpc: TrpcService,
    private readonly post: PostRouter,
    private readonly department: DepartmentRouter,
    private readonly staff: StaffRouter,
    private readonly term: TermRouter,
    private readonly taxonomy: TaxonomyRouter,
    private readonly role: RoleRouter,
    private readonly rolemap: RoleMapRouter,

    private readonly transform: TransformRouter,
    private readonly auth: AuthRouter,
    private readonly app_config: AppConfigRouter,
    private readonly message: MessageRouter,
    private readonly visitor: VisitRouter,
    // private readonly websocketService: WebSocketService
  ) { }
  appRouter = this.trpc.router({
    auth: this.auth.router,
    transform: this.transform.router,
    post: this.post.router,
    department: this.department.router,
    staff: this.staff.router,
    term: this.term.router,
    taxonomy: this.taxonomy.router,
    role: this.role.router,
    rolemap: this.rolemap.router,
    message: this.message.router,
    app_config: this.app_config.router,
    visitor: this.visitor.router
  });
  wss: WebSocketServer = undefined

  async applyMiddleware(app: INestApplication) {
    app.use(
      `/trpc`,
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
        createContext: this.trpc.createExpressContext,
        onError(opts) {
          const { error, type, path, input, ctx, req } = opts;
          // console.error('TRPC Error:', error);
        }
      }),
    );
    // applyWSSHandler({
    //   wss: this.websocketService.getWss("trpc"),
    //   router: this.appRouter,
    //   createContext: this.trpc.createWSSContext,
    // });
  }
}
export type AppRouter = TrpcRouter[`appRouter`];
