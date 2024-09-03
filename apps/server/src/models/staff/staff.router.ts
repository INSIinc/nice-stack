import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { StaffService } from './staff.service'; // Adjust the import path as necessary
import { z, StaffSchema } from '@nicestack/common';

@Injectable()
export class StaffRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly staffService: StaffService,
  ) {}

  router = this.trpc.router({
    create: this.trpc.procedure
      .input(StaffSchema.create) // Assuming StaffSchema.create is the Zod schema for creating staff
      .mutation(async ({ input }) => {
        return await this.staffService.create(input);
      }),

    update: this.trpc.procedure
      .input(StaffSchema.update) // Assuming StaffSchema.update is the Zod schema for updating staff
      .mutation(async ({ input }) => {
        return await this.staffService.update(input);
      }),

    batchDelete: this.trpc.procedure
      .input(StaffSchema.batchDelete) // Assuming StaffSchema.batchDelete is the Zod schema for batch deleting staff
      .mutation(async ({ input }) => {
        return await this.staffService.batchDelete(input);
      }),

    paginate: this.trpc.procedure
      .input(StaffSchema.paginate) // Define the input schema for pagination
      .query(async ({ input }) => {
        return await this.staffService.paginate(input);
      }),
    findByDept: this.trpc.procedure
      .input(StaffSchema.findByDept)
      .query(async ({ input }) => {
        return await this.staffService.findByDept(input);
      }),
    findMany: this.trpc.procedure
      .input(StaffSchema.findMany) // Assuming StaffSchema.findMany is the Zod schema for finding staffs by keyword
      .query(async ({ input }) => {
        return await this.staffService.findMany(input);
      }),
    findUnique: this.trpc.procedure
      .input(StaffSchema.findUnique)
      .query(async ({ input }) => {
        return await this.staffService.findUnique(input);
      }),
  });
}
