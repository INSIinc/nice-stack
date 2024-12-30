import { Injectable } from '@nestjs/common';
import {
  db,
  RoleMapMethodSchema,
  ObjectType,
  Prisma,
  RowModelRequest,
  UserProfile,
  ObjectWithId,
} from '@nicestack/common';
import { DepartmentService } from '@server/models/department/department.service';
import { TRPCError } from '@trpc/server';
import { RowModelService } from '../base/row-model.service';
import { isFieldCondition } from '../base/sql-builder';
import { z } from 'zod';

@Injectable()
export class RoleMapService extends RowModelService {
  createJoinSql(request?: RowModelRequest): string[] {
    return [
      `LEFT JOIN staff ON staff.id = ${this.tableName}.object_id`,
      `LEFT JOIN department ON department.id = staff.dept_id`,
    ];
  }
  createUnGroupingRowSelect(): string[] {
    return [
      `${this.tableName}.id AS id`,
      `${this.tableName}.object_id AS object_id`,
      `${this.tableName}.role_id AS role_id`,
      `${this.tableName}.domain_id AS domain_id`,
      `${this.tableName}.object_type AS object_type`,
      `staff.officer_id AS staff_officer_id`,
      `staff.username AS staff_username`,
      `department.name AS department_name`,
      `staff.showname AS staff_`,
    ];
  }

  constructor(private readonly departmentService: DepartmentService) {
    super('rolemap');
  }
  protected createGetRowsFilters(
    request: z.infer<typeof RoleMapMethodSchema.getRows>,
    staff: UserProfile,
  ) {
    const { roleId, domainId } = request;
    // Base conditions
    let condition = super.createGetRowsFilters(request, staff);
    if (isFieldCondition(condition)) return;
    // Adding conditions based on parameters existence
    if (roleId) {
      condition.AND.push({
        field: `${this.tableName}.role_id`,
        value: roleId,
        op: 'equals',
      });
    }
    if (domainId) {
      condition.AND.push({
        field: `${this.tableName}.domain_id`,
        value: domainId,
        op: 'equals',
      });
    }
    return condition;
  }

  protected async getRowDto(
    row: ObjectWithId,
    staff?: UserProfile,
  ): Promise<any> {
    if (!row.id) return row;
    return row;
  }
  /**
   * 删除某对象的所有角色
   * @param data 包含对象ID的数据
   * @returns 删除结果
   */
  async deleteAllRolesForObject(
    data: z.infer<typeof RoleMapMethodSchema.deleteWithObject>,
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
  async setRoleForObject(data: z.infer<typeof RoleMapMethodSchema.create>) {
    return await db.roleMap.create({
      data,
    });
  }
  /**
   * 批量为多个对象创建角色映射
   * @param data 角色映射数据
   * @returns 创建的角色映射列表
   */
  async setRoleForObjects(
    data: z.infer<typeof RoleMapMethodSchema.setRoleForObjects>,
  ) {
    const { domainId, roleId, objectIds, objectType } = data;
    const roleMaps = objectIds.map((id) => ({
      domainId,
      objectId: id,
      roleId,
      objectType,
    }));
    // 开启事务
    const result = await db.$transaction(async (prisma) => {
      // 首先，删除现有的角色映射
      await prisma.roleMap.deleteMany({
        where: {
          domainId,
          roleId,
          objectType,
        },
      });
      // 然后，创建新的角色映射
      return await prisma.roleMap.createManyAndReturn({
        data: roleMaps,
      });
    });
    const wrapResult = Promise.all(result.map(async item => {
      const staff = await db.staff.findMany({
        include: { department: true },
        where: {
          id: item.objectId
        }
      })
      return { ...item, staff }
    }))
    return wrapResult;
  }
  async addRoleForObjects(
    data: z.infer<typeof RoleMapMethodSchema.setRoleForObjects>,
  ) {
    const { domainId, roleId, objectIds, objectType } = data;
    const objects = await db.roleMap.findMany({
      where: { domainId, roleId, objectType },
    });
    data.objectIds = Array.from(
      new Set([...objectIds, ...objects.map((obj) => obj.objectId)]),
    );
    const result = this.setRoleForObjects(data);
    return result;
  }
  /**
   * 为某对象设置多个角色
   * @param data 角色映射数据
   * @returns 创建的角色映射列表
   */
  async setRolesForObject(
    data: z.infer<typeof RoleMapMethodSchema.setRolesForObject>,
  ) {
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
    data: z.infer<typeof RoleMapMethodSchema.getPermsForObject>,
  ) {
    const { domainId, deptId, staffId } = data;
    // Get all ancestor department IDs if deptId is provided.
    const ancestorDeptIds = deptId
      ? await this.departmentService.getAncestorIds(deptId)
      : [];
    // Define a common filter for querying roles.
    const objectFilters: Prisma.RoleMapWhereInput[] = [
      { objectId: staffId, objectType: ObjectType.STAFF },
      ...(deptId || ancestorDeptIds.length > 0
        ? [
          {
            objectId: { in: [deptId, ...ancestorDeptIds].filter(Boolean) },
            objectType: ObjectType.DEPARTMENT,
          },
        ]
        : []),
    ];
    // Helper function to fetch roles based on domain ID.
    const fetchRoles = async (domainId: string) => {
      return db.roleMap.findMany({
        where: {
          AND: {
            domainId,
            OR: objectFilters,
          },
        },
        include: { role: true },
      });
    };
    // Fetch roles with and without specific domain IDs.
    const [nullDomainRoles, userRoles] = await Promise.all([
      fetchRoles(null),
      fetchRoles(domainId),
    ]);
    // Extract permissions from roles and return them.
    return [...userRoles, ...nullDomainRoles].flatMap(
      ({ role }) => role.permissions,
    );
  }

  /**
   * 批量删除角色映射
   * @param data 包含要删除的角色映射ID列表的数据
   * @returns 删除结果
   * @throws 如果未提供ID，将抛出错误
   */
  async deleteMany(data: z.infer<typeof RoleMapMethodSchema.deleteMany>) {
    const { ids } = data;
    if (!ids || ids.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No IDs provided for deletion.',
      });
    }
    const rowData = await this.getRowByIds({ ids, extraCondition: {} });
    await db.roleMap.deleteMany({
      where: { id: { in: ids } },
    });
    return rowData;
  }

  /**
   * 分页获取角色映射
   * @param data 包含分页信息的数据
   * @returns 分页结果，包含角色映射列表和总数
   */
  async paginate(data: z.infer<typeof RoleMapMethodSchema.paginate>) {
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
  async getStaffsNotMap(data: z.infer<typeof RoleMapMethodSchema.getStaffsNotMap>) {
    const { domainId, roleId } = data;
    let staffs = await db.staff.findMany({
      where: {
        domainId,
      },
    });
    const roleMaps = await db.roleMap.findMany({
      where: {
        domainId,
        roleId,
        objectType: ObjectType.STAFF,
      },
    });
    staffs = staffs.filter(
      (staff) =>
        roleMaps.findIndex((roleMap) => roleMap.objectId === staff.id) === -1,
    );
    return staffs;
  }
  /**
   * 更新角色映射
   * @param data 包含更新信息的数据
   * @returns 更新后的角色映射
   */
  async update(data: z.infer<typeof RoleMapMethodSchema.update>) {
    const { id, ...others } = data;

    const updatedRoleMap = await db.roleMap.update({
      where: { id },
      data: { ...others },
    });
    return updatedRoleMap;
  }

  /**
   * 获取角色映射详情
   * @param data 包含角色ID和域ID的数据
   * @returns 角色映射详情，包含部门ID和员工ID列表
   */
  async getRoleMapDetail(data: z.infer<typeof RoleMapMethodSchema.getRoleMapDetail>) {
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
