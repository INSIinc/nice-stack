import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { DepartmentService } from './department.service'; // assuming it's in the same directory
import { DepartmentMethodSchema, Prisma, UpdateOrderSchema } from '@nicestack/common';
import { z, ZodType } from 'zod';
import { DepartmentRowService } from './department.row.service';

const DepartmentCreateArgsSchema: ZodType<Prisma.DepartmentCreateArgs> = z.any()
const DepartmentUpdateArgsSchema: ZodType<Prisma.DepartmentUpdateArgs> = z.any()
const DepartmentFindFirstArgsSchema: ZodType<Prisma.DepartmentFindFirstArgs> = z.any()
const DepartmentFindManyArgsSchema: ZodType<Prisma.DepartmentFindManyArgs> = z.any()
@Injectable()
export class DepartmentRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly departmentService: DepartmentService, // 注入 DepartmentService
    private readonly departmentRowService: DepartmentRowService
  ) { }
  router = this.trpc.router({
    // 创建部门
    create: this.trpc.protectProcedure
      .input(DepartmentCreateArgsSchema) // 根据 schema 期望输入
      .mutation(async ({ input }) => {
        return this.departmentService.create(input);
      }),
    // 更新部门
    update: this.trpc.protectProcedure
      .input(DepartmentUpdateArgsSchema) // 根据 schema 期望输入
      .mutation(async ({ input }) => {
        return this.departmentService.update(input);
      }),
    // 根据 ID 列表软删除部门
    softDeleteByIds: this.trpc.protectProcedure
      .input(z.object({ ids: z.array(z.string()) })) // 根据 schema 期望输入
      .mutation(async ({ input }) => {
        return this.departmentService.softDeleteByIds(input.ids);
      }),
    // 更新部门顺序
    updateOrder: this.trpc.protectProcedure.input(UpdateOrderSchema).mutation(async ({ input }) => {
      return this.departmentService.updateOrder(input)
    }),
    // 查询多个部门
    findMany: this.trpc.procedure
      .input(DepartmentFindManyArgsSchema) // 假设 StaffMethodSchema.findMany 是根据关键字查找员工的 Zod schema
      .query(async ({ input }) => {
        return await this.departmentService.findMany(input);
      }),
    // 查询第一个部门
    findFirst: this.trpc.procedure
      .input(DepartmentFindFirstArgsSchema) // 假设 StaffMethodSchema.findMany 是根据关键字查找员工的 Zod schema
      .query(async ({ input }) => {
        return await this.departmentService.findFirst(input);
      }),
    // 获取子部门的简单树结构
    getChildSimpleTree: this.trpc.procedure
      .input(DepartmentMethodSchema.getSimpleTree).query(async ({ input }) => {
        return await this.departmentService.getChildSimpleTree(input)
      }),
    // 获取父部门的简单树结构
    getParentSimpleTree: this.trpc.procedure
      .input(DepartmentMethodSchema.getSimpleTree).query(async ({ input }) => {
        return await this.departmentService.getParentSimpleTree(input)
      }),
    // 获取部门行数据
    getRows: this.trpc.protectProcedure
      .input(DepartmentMethodSchema.getRows)
      .query(async ({ input, ctx }) => {
        return await this.departmentRowService.getRows(input, ctx.staff);
      }),
  });
}
