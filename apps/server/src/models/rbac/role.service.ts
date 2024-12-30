import { Injectable } from '@nestjs/common';
import { db, RoleMethodSchema, RowModelRequest, UserProfile, RowRequestSchema, ObjectWithId, ObjectType } from "@nicestack/common";
import { DepartmentService } from '@server/models/department/department.service';
import EventBus, { CrudOperation } from '@server/utils/event-bus';

import { TRPCError } from '@trpc/server';
import { RowModelService } from '../base/row-model.service';
import { isFieldCondition, LogicalCondition } from '../base/sql-builder';
import { z } from 'zod';
@Injectable()
export class RoleService extends RowModelService {
    protected createGetRowsFilters(
        request: z.infer<typeof RowRequestSchema>,
        staff?: UserProfile
    ) {
        const condition = super.createGetRowsFilters(request)
        if (isFieldCondition(condition))
            return {}
        const baseModelCondition: LogicalCondition[] = [{
            field: `${this.tableName}.deleted_at`,
            op: "blank",
            type: "date"
        }]
        condition.AND = [...baseModelCondition, ...condition.AND]
        return condition
    }
    createUnGroupingRowSelect(): string[] {
        return [
            `${this.tableName}.id AS id`,
            `${this.tableName}.name AS name`,
            `${this.tableName}.system AS system`,
            `${this.tableName}.permissions AS permissions`
        ];
    }
    protected async getRowDto(data: ObjectWithId, staff?: UserProfile): Promise<any> {
        if (!data.id)
            return data
        const roleMaps = await db.roleMap.findMany({
            where: {
                roleId: data.id
            }
        })
        const deptIds = roleMaps.filter(item => item.objectType === ObjectType.DEPARTMENT).map(roleMap => roleMap.objectId)
        const staffIds = roleMaps.filter(item => item.objectType === ObjectType.STAFF).map(roleMap => roleMap.objectId)
        const depts = await db.department.findMany({ where: { id: { in: deptIds } } })
        const staffs = await db.staff.findMany({ where: { id: { in: staffIds } } })
        const result = { ...data, depts, staffs }
        return result
    }
    createJoinSql(request?: RowModelRequest): string[] {
        return [];
    }
    constructor(
        private readonly departmentService: DepartmentService
    ) {
        super("role")
    }
    /**
     * 创建角色
     * @param data 包含创建角色所需信息的数据
     * @returns 创建的角色
     */
    async create(data: z.infer<typeof RoleMethodSchema.create>) {
        const result = await db.role.create({ data })
        EventBus.emit('dataChanged', {
            type: ObjectType.ROLE,
            operation: CrudOperation.CREATED,
            data: result,
        });
        return result
    }
    async findById(id: string) {
        return await db.role.findUnique({
            where: {
                id
            }
        })
    }
    /**
     * 更新角色
     * @param data 包含更新角色所需信息的数据
     * @returns 更新后的角色
     */
    async update(data: z.infer<typeof RoleMethodSchema.update>) {
        const { id, ...others } = data;
        // 开启事务
        const result = await db.role.update({
            where: { id },
            data: { ...others }
        });

        EventBus.emit('dataChanged', {
            type: ObjectType.ROLE,
            operation: CrudOperation.UPDATED,
            data: result,
        });
        return result
    }
    /**
     * 批量删除角色
     * @param data 包含要删除的角色ID列表的数据
     * @returns 删除结果
     * @throws 如果未提供ID，将抛出错误
     */
    async deleteMany(data: z.infer<typeof RoleMethodSchema.deleteMany>) {
        const { ids } = data;
        if (!ids || ids.length === 0) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'No IDs provided for deletion.'
            });
        }
        // 开启事务
        const result = await db.$transaction(async (prisma) => {
            await prisma.roleMap.deleteMany({
                where: {
                    roleId: {
                        in: ids
                    }
                }
            });
            const deletedRoles = await prisma.role.deleteMany({
                where: {
                    id: { in: ids }
                }
            });
            return { success: true, count: deletedRoles.count };
        });
        EventBus.emit('dataChanged', {
            type: ObjectType.ROLE,
            operation: CrudOperation.DELETED,
            data: result,
        });
        return result
    }
    /**
     * 分页获取角色
     * @param data 包含分页信息的数据
     * @returns 分页结果，包含角色列表和总数
     */
    async paginate(data: z.infer<typeof RoleMethodSchema.paginate>) {
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
    async findMany(data: z.infer<typeof RoleMethodSchema.findMany>) {
        const { keyword = '' } = data
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
            orderBy: { createdAt: "asc" },
            take: 10
        })
    }
}
