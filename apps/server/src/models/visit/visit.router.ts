import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { ChangedRows, ObjectType, Prisma } from '@nicestack/common';

import { VisitService } from './visit.service';
import { z, ZodType } from 'zod';
const VisitCreateArgsSchema: ZodType<Prisma.VisitCreateArgs> = z.any()
const VisitCreateManyInputSchema: ZodType<Prisma.VisitCreateManyInput> = z.any()
const VisitDeleteManyArgsSchema: ZodType<Prisma.VisitDeleteManyArgs> = z.any()
@Injectable()
export class VisitRouter {
    constructor(
        private readonly trpc: TrpcService,
        private readonly visitService: VisitService,
    ) { }
    router = this.trpc.router({
        create: this.trpc.protectProcedure
            .input(VisitCreateArgsSchema)
            .mutation(async ({ ctx, input }) => {
                const { staff } = ctx;
                return await this.visitService.create(input, staff);
            }),
        createMany: this.trpc.protectProcedure.input(z.array(VisitCreateManyInputSchema))
            .mutation(async ({ ctx, input }) => {
                const { staff } = ctx;

                return await this.visitService.createMany({ data: input }, staff);
            }),
        deleteMany: this.trpc.procedure
            .input(VisitDeleteManyArgsSchema)
            .mutation(async ({ input }) => {
                return await this.visitService.deleteMany(input);
            }),
      

    });
}
