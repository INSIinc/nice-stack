import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { AppConfigService } from './app-config.service';
import { z, ZodType } from 'zod';
import { Prisma } from '@nicestack/common';
import { RealtimeServer } from '@server/socket/realtime/realtime.server';
const AppConfigUncheckedCreateInputSchema: ZodType<Prisma.AppConfigUncheckedCreateInput> = z.any()
const AppConfigUpdateArgsSchema: ZodType<Prisma.AppConfigUpdateArgs> = z.any()
const AppConfigDeleteManyArgsSchema: ZodType<Prisma.AppConfigDeleteManyArgs> = z.any()
const AppConfigFindFirstArgsSchema: ZodType<Prisma.AppConfigFindFirstArgs> = z.any()
@Injectable()
export class AppConfigRouter {
    constructor(
        private readonly trpc: TrpcService,
        private readonly appConfigService: AppConfigService,
        private readonly realtimeServer: RealtimeServer
    ) { }
    router = this.trpc.router({
        create: this.trpc.protectProcedure
            .input(AppConfigUncheckedCreateInputSchema)
            .mutation(async ({ ctx, input }) => {
                const { staff } = ctx;
                return await this.appConfigService.create({ data: input });
            }),
        update: this.trpc.protectProcedure
            .input(AppConfigUpdateArgsSchema)
            .mutation(async ({ ctx, input }) => {

                const { staff } = ctx;
                return await this.appConfigService.update(input);
            }),
        deleteMany: this.trpc.protectProcedure.input(AppConfigDeleteManyArgsSchema).mutation(async ({ input }) => {
            return await this.appConfigService.deleteMany(input)
        }),
        findFirst: this.trpc.protectProcedure.input(AppConfigFindFirstArgsSchema).
            query(async ({ input }) => {

                return await this.appConfigService.findFirst(input)
            }),
        clearRowCache: this.trpc.protectProcedure.mutation(async () => {
            return await this.appConfigService.clearRowCache()
        }),
        getClientCount: this.trpc.protectProcedure.query(() => {
            return this.realtimeServer.getClientCount()
        })
    });
}
