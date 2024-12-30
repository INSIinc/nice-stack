import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { StaffService } from './staff.service'; // Adjust the import path as necessary
import { StaffMethodSchema, Prisma, UpdateOrderSchema } from '@nicestack/common';
import { z, ZodType } from 'zod';
import { StaffRowService } from './staff.row.service';
const StaffCreateArgsSchema: ZodType<Prisma.StaffCreateArgs> = z.any();
const StaffUpdateArgsSchema: ZodType<Prisma.StaffUpdateArgs> = z.any();
const StaffFindFirstArgsSchema: ZodType<Prisma.StaffFindFirstArgs> = z.any();
const StaffDeleteManyArgsSchema: ZodType<Prisma.StaffDeleteManyArgs> = z.any();
const StaffWhereInputSchema: ZodType<Prisma.StaffWhereInput> = z.any();
const StaffSelectSchema: ZodType<Prisma.StaffSelect> = z.any();
const StaffUpdateInputSchema: ZodType<Prisma.PostUpdateInput> = z.any();
const StaffFindManyArgsSchema: ZodType<Prisma.StaffFindManyArgs> = z.any();
@Injectable()
export class StaffRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly staffService: StaffService,
    private readonly staffRowService: StaffRowService
  ) { }

  router = this.trpc.router({
    create: this.trpc.procedure
      .input(StaffCreateArgsSchema) // Assuming StaffMethodSchema.create is the Zod schema for creating staff
      .mutation(async ({ input }) => {
        return await this.staffService.create(input);
      }),

    update: this.trpc.procedure
      .input(StaffUpdateArgsSchema) // Assuming StaffMethodSchema.update is the Zod schema for updating staff
      .mutation(async ({ input }) => {
        return await this.staffService.update(input);
      }),
    updateUserDomain: this.trpc.protectProcedure
      .input(
        z.object({
          domainId: z.string()
        }),
      )
      .mutation(async ({ input, ctx }) => {
        return await this.staffService.updateUserDomain(input, ctx.staff);
      }),
    softDeleteByIds: this.trpc.protectProcedure
      .input(
        z.object({
          ids: z.array(z.string()),
          data: StaffUpdateInputSchema.nullish(),
        }),
      )
      .mutation(async ({ input }) => {
        return await this.staffService.softDeleteByIds(input.ids, input.data);
      }),
    findByDept: this.trpc.procedure
      .input(StaffMethodSchema.findByDept)
      .query(async ({ input }) => {
        return await this.staffService.findByDept(input);
      }),
    findMany: this.trpc.procedure
      .input(StaffFindManyArgsSchema) // Assuming StaffMethodSchema.findMany is the Zod schema for finding staffs by keyword
      .query(async ({ input }) => {
        return await this.staffService.findMany(input);
      }),
    getRows: this.trpc.protectProcedure
      .input(StaffMethodSchema.getRows)
      .query(async ({ input, ctx }) => {
        return await this.staffRowService.getRows(input, ctx.staff);
      }),
    findFirst: this.trpc.protectProcedure
      .input(StaffFindFirstArgsSchema)
      .query(async ({ ctx, input }) => {
        const { staff } = ctx;
        return await this.staffService.findFirst(input);
      }),
    updateOrder: this.trpc.protectProcedure.input(UpdateOrderSchema).mutation(async ({ input }) => {
      return this.staffService.updateOrder(input)
    }),
  });
}
