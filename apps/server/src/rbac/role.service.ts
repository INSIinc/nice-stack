import { Injectable } from '@nestjs/common';
import { db, z, RoleSchema, ObjectType, Role, RoleMap } from "@nicestack/common";
import { DepartmentService } from '@server/models/department/department.service';
import { TRPCError } from '@trpc/server';

@Injectable()
export class RoleService {
    constructor(
        private readonly departmentService: DepartmentService
    ) { }

    /**
     * 创建角色
     * @param data 包含创建角色所需信息的数据
     * @returns 创建的角色
     */
    async create(data: z.infer<typeof RoleSchema.create>) {

        // 开启事务
        return await db.$transaction(async (prisma) => {
            // 创建角色
            return await prisma.role.create({ data });
        });
    }

    /**
     * 更新角色
     * @param data 包含更新角色所需信息的数据
     * @returns 更新后的角色
     */
    async update(data: z.infer<typeof RoleSchema.update>) {
        const { id, ...others } = data;

        // 开启事务
        return await db.$transaction(async (prisma) => {
            // 更新角色
            const updatedRole = await prisma.role.update({
                where: { id },
                data: { ...others }
            });

            return updatedRole;
        });
    }

    /**
     * 批量删除角色
     * @param data 包含要删除的角色ID列表的数据
     * @returns 删除结果
     * @throws 如果未提供ID，将抛出错误
     */
    async batchDelete(data: z.infer<typeof RoleSchema.batchDelete>) {
        const { ids } = data;
        if (!ids || ids.length === 0) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'No IDs provided for deletion.'
            });
        }

        // 开启事务
        return await db.$transaction(async (prisma) => {
            const deletedRoles = await prisma.role.updateMany({
                where: {
                    id: { in: ids }
                },
                data: { deletedAt: new Date() }
            });

            await prisma.roleMap.deleteMany({
                where: {
                    roleId: {
                        in: ids
                    }
                }
            });

            if (!deletedRoles.count) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'No roles were found with the provided IDs.'
                });
            }

            return { success: true, count: deletedRoles.count };
        });
    }

    /**
     * 分页获取角色
     * @param data 包含分页信息的数据
     * @returns 分页结果，包含角色列表和总数
     */
    async paginate(data: z.infer<typeof RoleSchema.paginate>) {
        const { page, pageSize } = data;
        const [items, totalCount] = await Promise.all([
            db.role.findMany({
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { name: "asc" },
                where: { deletedAt: null },
                include: {
                    roleMaps: true,
                }
            }),
            db.role.count({ where: { deletedAt: null } }),
        ]);
        const result = { items, totalCount };
        return result;
    }

    /**
     * 根据关键字查找多个角色
     * @param data 包含关键字的数据
     * @returns 查找到的角色列表
     */
    async findMany(data: z.infer<typeof RoleSchema.findMany>) {
        const { keyword } = data
        return await db.role.findMany({
            where: {
                deletedAt: null,
                OR: [
                    {
                        name: {
                            contains: keyword
                        }
                    }
                ]
            },
            orderBy: { name: "asc" },
            take: 10
        })
    }
}
