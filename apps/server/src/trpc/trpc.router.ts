import { INestApplication, Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import * as trpcExpress from '@trpc/server/adapters/express';
import { HelloRouter } from '@server/hello/hello.router';

@Injectable()
export class TrpcRouter {
    constructor(private readonly trpc: TrpcService, private readonly hello: HelloRouter) { }

    appRouter = this.trpc.router({
        hello: this.hello.router
    });

    async applyMiddleware(app: INestApplication) {
        app.use(
            `/trpc`,
            trpcExpress.createExpressMiddleware({
                router: this.appRouter,
            }),
        );
    }
}

export type AppRouter = TrpcRouter[`appRouter`];

