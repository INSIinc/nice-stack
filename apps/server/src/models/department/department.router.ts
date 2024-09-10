import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { DepartmentService } from './department.service'; // assuming it's in the same directory
import { DepartmentSchema, z } from '@nicestack/common';

@Injectable()
export class DepartmentRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly departmentService: DepartmentService, // inject DepartmentService
  ) {}
  router = this.trpc.router({
    create: this.trpc.protectProcedure
      .input(DepartmentSchema.create) // expect input according to the schema
      .mutation(async ({ input }) => {
        return this.departmentService.create(input);
      }),
    update: this.trpc.protectProcedure
      .input(DepartmentSchema.update) // expect input according to the schema
      .mutation(async ({ input }) => {
        return this.departmentService.update(input);
      }),

    delete: this.trpc.protectProcedure
      .input(DepartmentSchema.delete) // expect input according to the schema
      .mutation(async ({ input }) => {
        return this.departmentService.delete(input);
      }),
    getDepartmentDetails: this.trpc.procedure
      .input(z.object({ deptId: z.string() })) // expect an object with deptId
      .query(async ({ input }) => {
        return this.departmentService.getDepartmentDetails(input.deptId);
      }),
    getAllChildDeptIds: this.trpc.procedure
      .input(z.object({ deptId: z.string() })) // expect an object with deptId
      .query(async ({ input }) => {
        return this.departmentService.getAllChildDeptIds(input.deptId);
      }),
    getAllParentDeptIds: this.trpc.procedure
      .input(z.object({ deptId: z.string() })) // expect an object with deptId
      .query(async ({ input }) => {
        return this.departmentService.getAllParentDeptIds(input.deptId);
      }),
    getChildren: this.trpc.procedure
      .input(z.object({ parentId: z.string().nullish() }))
      .query(async ({ input }) => {
        return this.departmentService.getChildren(input.parentId);
      }),
    getDomainDepartments: this.trpc.procedure
      .input(z.object({ query: z.string().nullish() }))
      .query(async ({ input }) => {
        const { query } = input;
        return this.departmentService.getDomainDepartments(query);
      }),
    findMany: this.trpc.procedure
      .input(DepartmentSchema.findMany) // Assuming StaffSchema.findMany is the Zod schema for finding staffs by keyword
      .query(async ({ input }) => {
        return await this.departmentService.findMany(input);
      }),
    paginate: this.trpc.procedure
      .input(DepartmentSchema.paginate) // Assuming StaffSchema.findMany is the Zod schema for finding staffs by keyword
      .query(async ({ input }) => {
        return await this.departmentService.paginate(input);
      }),
  });
}
