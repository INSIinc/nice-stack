import { Injectable } from '@nestjs/common';
import { db, ObjectType, Staff, StaffSchema, z } from '@nicestack/common';
import { TRPCError } from '@trpc/server';
import { DepartmentService } from '../department/department.service';
@Injectable()
export class StaffService {
    constructor(private readonly departmentService: DepartmentService) { }

    /**
     *  获取某一单位下所有staff的记录
     * @param deptId 单位的id
     * @returns 查到的staff记录
     */
    async findByDept(data: z.infer<typeof StaffSchema.findByDept>) {
        const { deptId, domainId } = data;
        const childDepts = await this.departmentService.getAllChildDeptIds(deptId);
        const result = await db.staff.findMany({
            where: {
                deptId: { in: [...childDepts, deptId] },
                domainId,
            },
        });
        return result;
    }
    /**
     * 创建新的员工记录
     * @param data 员工创建信息
     * @returns 新创建的员工记录
     */
    async create(data: z.infer<typeof StaffSchema.create>) {
        const { ...others } = data;

        try {
            return await db.$transaction(async (transaction) => {
                // 获取当前最大order值
                const maxOrder = await transaction.staff.aggregate({
                    _max: { order: true },
                });
                // 新员工的order值比现有最大order值大1
                const newOrder = (maxOrder._max.order ?? -1) + 1;
                // 创建新员工记录
                const newStaff = await transaction.staff.create({
                    data: { ...others, order: newOrder },
                    include: { domain: true, department: true },
                });
                return newStaff;
            });
        } catch (error) {
            console.error('Failed to create staff:', error);
            throw error;
        }
    }
    /**
     * 更新员工记录
     * @param data 包含id和其他更新字段的对象
     * @returns 更新后的员工记录
     */
    async update(data: z.infer<typeof StaffSchema.update>) {
        const { id, ...others } = data;
        try {
            return await db.$transaction(async (transaction) => {
                // 更新员工记录
                const updatedStaff = await transaction.staff.update({
                    where: { id },
                    data: others,
                    include: { domain: true, department: true },
                });
                return updatedStaff;
            });
        } catch (error) {
            console.error('Failed to update staff:', error);
            throw error;
        }
    }
    /**
     * 批量删除员工记录（软删除）
     * @param data 包含要删除的员工ID数组的对象
     * @returns 删除操作结果，包括删除的记录数
     */
    async batchDelete(data: z.infer<typeof StaffSchema.batchDelete>) {
        const { ids } = data;

        if (!ids || ids.length === 0) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'No IDs provided for deletion.',
            });
        }
        const deletedStaffs = await db.staff.updateMany({
            where: { id: { in: ids } },
            data: { deletedAt: new Date() },
        });
        if (!deletedStaffs.count) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No taxonomies were found with the provided IDs.',
            });
        }
        return { success: true, count: deletedStaffs.count };
    }
    /**
     * 分页查询员工
     * @param data 包含分页参数、域ID和部门ID的对象
     * @returns 员工列表及总记录数
     */
    async paginate(data: z.infer<typeof StaffSchema.paginate>) {
        const { page, pageSize, domainId, deptId, ids } = data;
        const childDepts = await this.departmentService.getAllChildDeptIds(deptId);
        const [items, totalCount] = await Promise.all([
            db.staff.findMany({
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { order: 'asc' },
                where: {
                    id: ids ? { in: ids } : undefined,
                    deletedAt: null,
                    domainId,
                    deptId: deptId ? { in: [...childDepts, deptId] } : undefined,
                },
                include: { domain: true, department: true },
            }),
            db.staff.count({
                where: {
                    deletedAt: null,
                    domainId,
                    deptId: deptId ? { in: [...childDepts, deptId] } : undefined,
                },
            }),
        ]);
        const processedItems = await Promise.all(
            items.map((item) => this.genStaffDto(item)),
        );
        return { items: processedItems, totalCount };
    }
    /**
     * 根据关键词或ID集合查找员工
     * @param data 包含关键词、域ID和ID集合的对象
     * @returns 匹配的员工记录列表
     */
    async findMany(data: z.infer<typeof StaffSchema.findMany>) {
        const { keyword, domainId, ids } = data;

        return await db.staff.findMany({
            where: {
                deletedAt: null,
                domainId,
                OR: [
                    { username: { contains: keyword } },
                    {
                        id: { in: ids },
                    },
                ],
            },
            orderBy: { order: 'asc' },
            take: 10,
        });
    }
    /**
     * 生成员工的数据传输对象（DTO）
     * @param staff 员工记录
     * @returns 含角色ID列表的员工DTO
     */
    private async genStaffDto(staff: Staff) {
        const roleMaps = await db.roleMap.findMany({
            where: {
                domainId: staff.domainId,
                objectId: staff.id,
                objectType: ObjectType.STAFF,
            },
            include: { role: true },
        });
        const roleIds = roleMaps.map((roleMap) => roleMap.role.id);
        return { ...staff, roleIds };
    }



}
