import { INestApplication, Injectable } from '@nestjs/common';
import { AuthRouter } from '@server/auth/auth.router';
import { TrpcService } from '@server/trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';
@Injectable()
export class TrpcRouter {
    constructor(private readonly trpc: TrpcService, private readonly auth: AuthRouter) { }
    appRouter = this.trpc.router({
        auth: this.auth.router
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

