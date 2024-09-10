import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { TermService } from './term.service'; // Adjust the import path as necessary
import { z, TermSchema } from '@nicestack/common';

@Injectable()
export class TermRouter {
    constructor(
        private readonly trpc: TrpcService,
        private readonly termService: TermService,
    ) { }
    router = this.trpc.router({
        create: this.trpc.protectProcedure
            .input(TermSchema.create)
            .mutation(async ({ input, ctx }) => {
                const { staff } = ctx
                return this.termService.create(staff, input);
            }),
        update: this.trpc.protectProcedure
            .input(TermSchema.update)
            .mutation(async ({ input }) => {
                return this.termService.update(input);
            }),
        delete: this.trpc.protectProcedure
            .input(TermSchema.delete)
            .mutation(async ({ input }) => {
                return this.termService.delete(input);
            }),
        findById: this.trpc.procedure.input(z.object({
            id: z.string()
        })).query(async ({ input, ctx }) => {
            const { staff } = ctx
            return this.termService.findUnique(staff, input.id)
        }),
        batchDelete: this.trpc.protectProcedure.input(z.object({
            ids: z.array(z.string())
        })).mutation(async ({ input }) => {
            const { ids } = input
            return this.termService.batchDelete(ids)
        }),
        getChildren: this.trpc.procedure.input(TermSchema.getChildren).query(async ({ input, ctx }) => {
            const { staff } = ctx
            return this.termService.getChildren(staff, input)
        }),
        getAllChildren: this.trpc.procedure.input(TermSchema.getChildren).query(async ({ input, ctx }) => {
            const { staff } = ctx
            return this.termService.getAllChildren(staff, input)
        }),
        findMany: this.trpc.procedure
            .input(TermSchema.findMany) // Assuming StaffSchema.findMany is the Zod schema for finding staffs by keyword
            .query(async ({ input }) => {
                return await this.termService.findMany(input);
            }),
    });
}
