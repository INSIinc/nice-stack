import { Injectable, Logger } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson-cjs';
import * as trpcExpress from '@trpc/server/adapters/express';
import { db, JwtPayload, UserProfile, RolePerms } from '@nicestack/common';
import { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';
import { UserProfileService } from '@server/auth/utils';
type Context = Awaited<ReturnType<TrpcService['createExpressContext']>>;
@Injectable()
export class TrpcService {
    private readonly logger = new Logger(TrpcService.name);

    async createExpressContext(opts: trpcExpress.CreateExpressContextOptions): Promise<{ staff: UserProfile | undefined }> {
        const token = opts.req.headers.authorization?.split(' ')[1];
        return await UserProfileService.instance.getUserProfileByToken(token);
    }
    async createWSSContext(opts: CreateWSSContextFnOptions): Promise<{ staff: UserProfile | undefined }> {
        const token = opts.info.connectionParams?.token;
        return await UserProfileService.instance.getUserProfileByToken(token);
    }
    trpc = initTRPC.context<Context>().create({
        transformer: superjson,
        errorFormatter: ({ error, shape }) => {
            if (error.code !== 'UNAUTHORIZED') {
                this.logger.error(error.message, error.stack);
            }
            return shape;
        }
    });

    procedure = this.trpc.procedure;
    router = this.trpc.router;
    mergeRouters = this.trpc.mergeRouters;

    // Define a protected procedure that ensures the user is authenticated
    protectProcedure = this.procedure.use(async ({ ctx, next }) => {
        if (!ctx?.staff) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: "未授权请求" });
        }
        return next({
            ctx: {
                // User value is confirmed to be non-null at this point
                staff: ctx.staff,
            },
        });

    });
}
