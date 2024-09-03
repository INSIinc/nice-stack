import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson-cjs';
import * as trpcExpress from '@trpc/server/adapters/express';
import { env } from '@server/env';
import { db, Staff, TokenPayload } from "@nicestack/common"
import { JwtService } from '@nestjs/jwt';

type Context = Awaited<ReturnType<TrpcService['createContext']>>;
@Injectable()
export class TrpcService {
    constructor(private readonly jwtService: JwtService) { }
    async createContext({
        req,
        res,
    }: trpcExpress.CreateExpressContextOptions) {
        const token = req.headers.authorization?.split(' ')[1];
        let tokenData: TokenPayload | undefined = undefined;
        let staff: Staff | undefined = undefined;
        if (token) {
            try {
                // Verify JWT token and extract tokenData
                tokenData = await this.jwtService.verifyAsync(token, { secret: env.JWT_SECRET }) as TokenPayload;
                if (tokenData) {
                    // Fetch staff details from the database using tokenData.id
                    staff = await db.staff.findUnique({ where: { id: tokenData.id } });
                    if (!staff) {
                        throw new TRPCError({ code: 'UNAUTHORIZED', message: "User not found" });
                    }
                }
            } catch (error) {
                // Enhanced error handling for invalid session data or token verification failure
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: "Invalid session data or token" });
            }
        }

        return {
            staff,
        };
    };
    trpc = initTRPC.context<Context>().create({
        transformer: superjson,
    });
    procedure = this.trpc.procedure;
    router = this.trpc.router;
    mergeRouters = this.trpc.mergeRouters;
    // Define a protected procedure that ensures the user is authenticated
    protectProcedure = this.procedure.use(async ({ ctx, next }) => {
        if (!ctx.staff) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: "Unauthorized request" });
        }
        return next({
            ctx: {
                // User value is confirmed to be non-null at this point
                staff: ctx.staff,
            },
        });
    });
}
