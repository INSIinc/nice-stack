import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { TermService } from './term.service'; // Adjust the import path as necessary
import { Prisma, TermMethodSchema, UpdateOrderSchema } from '@nicestack/common';
import { z, ZodType } from 'zod';
import { TermRowService } from './term.row.service';
const TermCreateArgsSchema: ZodType<Prisma.TermCreateArgs> = z.any();
const TermUpdateArgsSchema: ZodType<Prisma.TermUpdateArgs> = z.any();
const TermFindFirstArgsSchema: ZodType<Prisma.TermFindFirstArgs> = z.any();
const TermFindManyArgsSchema: ZodType<Prisma.TermFindManyArgs> = z.any();
@Injectable()
export class TermRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly termService: TermService,
    private readonly termRowService: TermRowService,
  ) {}
  router = this.trpc.router({
    create: this.trpc.protectProcedure
      .input(TermCreateArgsSchema)
      .mutation(async ({ input, ctx }) => {
        const { staff } = ctx;
        return this.termService.create(input, { staff });
      }),
    update: this.trpc.protectProcedure
      .input(TermUpdateArgsSchema)
      .mutation(async ({ input }) => {
        return this.termService.update(input);
      }),
    findMany: this.trpc.procedure
      .input(TermFindManyArgsSchema) // Assuming StaffMethodSchema.findMany is the Zod schema for finding staffs by keyword
      .query(async ({ input }) => {
        return await this.termService.findMany(input);
      }),
    findFirst: this.trpc.procedure
      .input(TermFindFirstArgsSchema) // Assuming StaffMethodSchema.findMany is the Zod schema for finding staffs by keyword
      .query(async ({ input }) => {
        return await this.termService.findFirst(input);
      }),
    softDeleteByIds: this.trpc.protectProcedure
      .input(z.object({ ids: z.array(z.string()) })) // expect input according to the schema
      .mutation(async ({ input }) => {
        return this.termService.softDeleteByIds(input.ids);
      }),
    updateOrder: this.trpc.protectProcedure
      .input(UpdateOrderSchema)
      .mutation(async ({ input }) => {
        return this.termService.updateOrder(input);
      }),
    upsertTags: this.trpc.protectProcedure
      .input(
        z.object({
          tags: z.array(z.string()),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const { staff } = ctx;
        return this.termService.upsertTags(staff, input.tags);
      }),
    getChildSimpleTree: this.trpc.procedure
      .input(TermMethodSchema.getSimpleTree)
      .query(async ({ input, ctx }) => {
        const { staff } = ctx;
        return await this.termService.getChildSimpleTree(staff, input);
      }),
    getParentSimpleTree: this.trpc.procedure
      .input(TermMethodSchema.getSimpleTree)
      .query(async ({ input, ctx }) => {
        const { staff } = ctx;
        return await this.termService.getParentSimpleTree(staff, input);
      }),
    getTreeData: this.trpc.protectProcedure
      .input(TermMethodSchema.getTreeData)
      .query(async ({ input }) => {
        return await this.termService.getTreeData(input);
      }),
    getRows: this.trpc.protectProcedure
      .input(TermMethodSchema.getRows)
      .query(async ({ input, ctx }) => {
        return await this.termRowService.getRows(input, ctx.staff);
      }),
  });
}
