import { Injectable } from '@nestjs/common';
import { db, z, RoleMapSchema, ObjectType } from '@nicestack/common';
import { DepartmentService } from '@server/models/department/department.service';
import { TRPCError } from '@trpc/server';

@Injectable()
export class RoleMapService {
  constructor(private readonly departmentService: DepartmentService) { }

  /**
   * 删除某对象的所有角色
   * @param data 包含对象ID的数据
   * @returns 删除结果
   */
  async deleteAllRolesForObject(
    data: z.infer<typeof RoleMapSchema.deleteWithObject>,
  ) {
    const { objectId } = data;
    return await db.roleMap.deleteMany({
      where: {
        objectId,
      },
    });
  }

  /**
   * 为某对象设置一个角色
   * @param data 角色映射数据
   * @returns 创建的角色映射
   */
  async setRoleForObject(data: z.infer<typeof RoleMapSchema.create>) {
    return await db.roleMap.create({
      data,
    });
  }

  /**
   * 批量为多个对象创建角色映射
   * @param data 角色映射数据
   * @returns 创建的角色映射列表
   */
  async createManyObjects(
    data: z.infer<typeof RoleMapSchema.createManyObjects>,
  ) {
    const { domainId, roleId, objectIds, objectType } = data;
    const roleMaps = objectIds.map((id) => ({
      domainId,
      objectId: id,
      roleId,
      objectType,
    }));

    // 开启事务
    return await db.$transaction(async (prisma) => {
      // 首先，删除现有的角色映射
      await prisma.roleMap.deleteMany({
        where: {
          domainId,
          roleId,
          objectType,
        },
      });
      // 然后，创建新的角色映射
      return await prisma.roleMap.createMany({
        data: roleMaps,
      });
    });
  }

  /**
   * 为某对象设置多个角色
   * @param data 角色映射数据
   * @returns 创建的角色映射列表
   */
  async setRolesForObject(data: z.infer<typeof RoleMapSchema.createManyRoles>) {
    const { domainId, objectId, roleIds, objectType } = data;
    const roleMaps = roleIds.map((id) => ({
      domainId,
      objectId,
      roleId: id,
      objectType,
    }));

    return await db.roleMap.createMany({ data: roleMaps });
  }

  /**
   * 获取某对象的权限
   * @param data 包含域ID、部门ID和对象ID的数据
   * @returns 用户角色的权限列表
   */
  async getPermsForObject(
    data: z.infer<typeof RoleMapSchema.getPermsForObject>,
  ) {
    const { domainId, deptId, staffId } = data;

    let ancestorDeptIds = [];
    if (deptId) {
      ancestorDeptIds =
        await this.departmentService.getAllParentDeptIds(deptId);
    }

    const userRoles = await db.roleMap.findMany({
      where: {
        AND: {
          domainId,
          OR: [
            {
              objectId: staffId,
              objectType: ObjectType.STAFF
            },
            (deptId ? {
              objectId: { in: [deptId, ...ancestorDeptIds] },
              objectType: ObjectType.DEPARTMENT,
            } : {}),
          ],
        },
      },
      include: { role: true },
    });

    return userRoles.flatMap((userRole) => userRole.role.permissions);
  }

  /**
   * 批量删除角色映射
   * @param data 包含要删除的角色映射ID列表的数据
   * @returns 删除结果
   * @throws 如果未提供ID，将抛出错误
   */
  async batchDelete(data: z.infer<typeof RoleMapSchema.batchDelete>) {
    const { ids } = data;

    if (!ids || ids.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No IDs provided for deletion.',
      });
    }

    const deletedRoleMaps = await db.roleMap.deleteMany({
      where: { id: { in: ids } },
    });

    if (!deletedRoleMaps.count) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No taxonomies were found with the provided IDs.',
      });
    }

    return { success: true, count: deletedRoleMaps.count };
  }

  /**
   * 分页获取角色映射
   * @param data 包含分页信息的数据
   * @returns 分页结果，包含角色映射列表和总数
   */
  async paginate(data: z.infer<typeof RoleMapSchema.paginate>) {
    const { page, pageSize, domainId, roleId } = data;

    const [items, totalCount] = await Promise.all([
      db.roleMap.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where: { domainId, roleId },
      }),
      db.roleMap.count({
        where: { domainId, roleId },
      }),
    ]);

    // const processedItems = await Promise.all(items.map(item => this.genRoleMapDto(item)));
    return { items, totalCount };
  }

  /**
   * 更新角色映射
   * @param data 包含更新信息的数据
   * @returns 更新后的角色映射
   */
  async update(data: z.infer<typeof RoleMapSchema.update>) {
    const { id, ...others } = data;

    // 开启事务
    return await db.$transaction(async (prisma) => {
      // 更新角色映射
      const updatedRoleMap = await prisma.roleMap.update({
        where: { id },
        data: { ...others },
      });
      return updatedRoleMap;
    });
  }

  /**
   * 获取角色映射详情
   * @param data 包含角色ID和域ID的数据
   * @returns 角色映射详情，包含部门ID和员工ID列表
   */
  async getRoleMapDetail(data: z.infer<typeof RoleMapSchema.getRoleMapDetail>) {
    const { roleId, domainId } = data;
    const res = await db.roleMap.findMany({ where: { roleId, domainId } });

    const deptIds = res
      .filter((item) => item.objectType === ObjectType.DEPARTMENT)
      .map((item) => item.objectId);
    const staffIds = res
      .filter((item) => item.objectType === ObjectType.STAFF)
      .map((item) => item.objectId);

    return { deptIds, staffIds };
  }
}
