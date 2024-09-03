import { INestApplication, Injectable } from '@nestjs/common';
import { AuthRouter } from '@server/auth/auth.router';
import { DepartmentRouter } from '@server/models/department/department.router';
import { StaffRouter } from '@server/models/staff/staff.router';
import { TrpcService } from '@server/trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';
import { TransformRouter } from '../transform/transform.router';
@Injectable()
export class TrpcRouter {
    constructor(private readonly trpc: TrpcService,
        private readonly auth: AuthRouter,
        private readonly staff: StaffRouter,
        private readonly department: DepartmentRouter,
        private readonly transform: TransformRouter
    ) { }
    appRouter = this.trpc.router({
        auth: this.auth.router,
        staff: this.staff.router,
        department: this.department.router,
        transform: this.transform.router
    });
    async applyMiddleware(app: INestApplication) {
        app.use(
            `/trpc`,
            trpcExpress.createExpressMiddleware({
                router: this.appRouter,
                createContext: this.trpc.createContext
            }),
        );
    }
}

export type AppRouter = TrpcRouter[`appRouter`];

