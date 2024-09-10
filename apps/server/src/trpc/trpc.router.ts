import { INestApplication, Injectable } from '@nestjs/common';
import { TransformRouter } from '@server/transform/transform.router';
import { DepartmentRouter } from '@server/models/department/department.router';
import { StaffRouter } from '@server/models/staff/staff.router';
import { TrpcService } from '@server/trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';
import { TaxonomyRouter } from '@server/models/taxonomy/taxonomy.router';
import { TermRouter } from '@server/models/term/term.router';
import { RoleRouter } from '@server/rbac/role.router';
import { RoleMapRouter } from '@server/rbac/rolemap.router';

@Injectable()
export class TrpcRouter {
    constructor(
        private readonly trpc: TrpcService,
        private readonly department: DepartmentRouter,
        private readonly staff: StaffRouter,
        private readonly term: TermRouter,
        private readonly taxonomy: TaxonomyRouter,
        private readonly role: RoleRouter,
        private readonly rolemap: RoleMapRouter,
        private readonly transform: TransformRouter,
    ) { }
    appRouter = this.trpc.router({
        transform: this.transform.router,
        department: this.department.router,
        staff: this.staff.router,
        term: this.term.router,
        taxonomy: this.taxonomy.router,
        role: this.role.router,
        rolemap: this.rolemap.router,
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
