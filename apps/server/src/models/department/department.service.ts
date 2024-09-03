import { Injectable } from '@nestjs/common';
import { db, z, DepartmentSchema } from '@nicestack/common';

@Injectable()
export class DepartmentService {
  /**
   * 获取某单位的所有子单位（平铺结构）。
   * @param deptId - 单位的唯一标识符。
   * @returns 包含所有子单位的数组，如果未传递deptId则返回undefined。
   */
  async getFlatChildDepts(deptId: string) {
    if (!deptId) return undefined;

    return await db.deptAncestry.findMany({
      where: { ancestorId: deptId },
    });
  }
  /**
   * 获取指定DOM下的对应name的单位
   * @param domId
   * @param name
   * @returns
   *
   *
   */

  async findByNameInDom(domId: string, name: string) {
    const subDepts = await db.deptAncestry.findMany({
      where: {
        ancestorId: domId,
      },
      include: {
        descendant: true,
      },
    });
    const dept = subDepts.find((item) => item.descendant.name === name);

    return dept?.descendant;
  }
  /**
   * 获取某单位的所有父单位（平铺结构）。
   * @param deptId - 单位的唯一标识符。
   * @returns 包含所有父单位的数组，如果未传递deptId则返回undefined。
   */
  async getFlatParentDepts(deptId: string) {
    if (!deptId) return undefined;

    return await db.deptAncestry.findMany({
      where: { descendantId: deptId },
    });
  }

  /**
   * 获取某单位的所有子单位ID。
   * @param deptId - 单位的唯一标识符。
   * @returns 包含所有子单位ID的数组。
   */
  async getAllChildDeptIds(deptId: string) {
    const res = await this.getFlatChildDepts(deptId);
    return res?.map((dept) => dept.descendantId) || [];
  }

  /**
   * 获取某单位的所有父单位ID。
   * @param deptId - 单位的唯一标识符。
   * @returns 包含所有父单位ID的数组。
   */
  async getAllParentDeptIds(deptId: string) {
    const res = await this.getFlatParentDepts(deptId);
    return res?.map((dept) => dept.ancestorId) || [];
  }

  /**
   * 获取单位及其直接子单位的详细信息。
   * @param deptId - 要获取的单位的唯一标识符。
   * @returns 包含单位详细信息的对象，包括其子单位和员工信息。
   */
  async getDepartmentDetails(deptId: string) {
    const department = await db.department.findUnique({
      where: { id: deptId },
      include: { children: true, deptStaffs: true },
    });

    const childrenData = await db.deptAncestry.findMany({
      where: { ancestorId: deptId, relDepth: 1 },
      include: { descendant: { include: { children: true } } },
    });

    const children = childrenData.map(({ descendant }) => ({
      id: descendant.id,
      name: descendant.name,
      order: descendant.order,
      parentId: descendant.parentId,
      hasChildren: Boolean(descendant.children?.length),
      childrenCount: descendant.children?.length || 0,
    }));

    return {
      id: department?.id,
      name: department?.name,
      order: department?.order,
      parentId: department?.parentId,
      children,
      staffs: department?.deptStaffs,
      hasChildren: !!children.length,
    };
  }

  /**
   * 获取某单位的所有直接子单位。
   * @param parentId - 父单位的唯一标识符，如果未传递则获取顶级单位。
   * @returns 包含所有直接子单位信息的数组。
   */
  async getChildren(parentId?: string) {
    const departments = await db.department.findMany({
      where: { parentId: parentId ?? null },
      include: { children: true, deptStaffs: true },
    });

    return departments.map((dept) => ({
      ...dept,
      hasChildren: dept.children.length > 0,
      staffs: dept.deptStaffs,
    }));
  }
  async paginate(data: z.infer<typeof DepartmentSchema.paginate>) {
    const { page, pageSize, ids } = data;

    const [items, totalCount] = await Promise.all([
      db.department.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where: {
          deletedAt: null,
          OR: [{ id: { in: ids } }],
        },
        include: { deptStaffs: true, parent: true },
        orderBy: { order: 'asc' },
      }),
      db.department.count({
        where: {
          deletedAt: null,
          OR: [{ id: { in: ids } }],
        },
      }),
    ]);

    return { items, totalCount };
  }
  async findMany(data: z.infer<typeof DepartmentSchema.findMany>) {
    const { keyword = '', ids } = data;

    const departments = await db.department.findMany({
      where: {
        deletedAt: null,
        OR: [{ name: { contains: keyword! } }, ids ? { id: { in: ids } } : {}],
      },
      include: { deptStaffs: true },
      orderBy: { order: 'asc' },
      take: 20,
    });

    return departments.map((dept) => ({
      ...dept,
      staffs: dept.deptStaffs,
    }));
  }

  /**
   * 获取所有域内单位，根据查询条件筛选结果。
   * @param query - 可选的查询条件，用于模糊匹配单位名称。
   * @returns 包含符合条件的域内单位信息的数组。
   */
  async getDomainDepartments(query?: string) {
    return await db.department.findMany({
      where: { isDomain: true, name: { contains: query } },
      take: 10,
    });
  }

  async getDeptIdsByStaffIds(ids: string[]) {
    const staffs = await db.staff.findMany({
      where: { id: { in: ids } },
    });

    return staffs.map((staff) => staff.deptId);
  }

  /**
   * 创建一个新的单位并管理DeptAncestry关系。
   * @param data - 用于创建新单位的数据。
   * @returns 新创建的单位对象。
   */
  async create(data: z.infer<typeof DepartmentSchema.create>) {
    let newOrder = 0;

    // 确定新单位的顺序
    const siblingDepartments = await db.department.findMany({
      where: { parentId: data.parentId ?? null },
      orderBy: { order: 'desc' },
      take: 1,
    });

    if (siblingDepartments.length > 0) {
      newOrder = siblingDepartments[0].order + 1;
    }

    // 根据计算的顺序创建新单位
    const newDepartment = await db.department.create({
      data: { ...data, order: newOrder },
    });

    // 如果存在parentId，则更新DeptAncestry关系
    if (data.parentId) {
      const parentAncestries = await db.deptAncestry.findMany({
        where: { descendantId: data.parentId },
        orderBy: { relDepth: 'asc' },
      });

      // 为新单位创建新的祖先记录
      const newAncestries = parentAncestries.map((ancestry) => ({
        ancestorId: ancestry.ancestorId,
        descendantId: newDepartment.id,
        relDepth: ancestry.relDepth + 1,
      }));

      newAncestries.push({
        ancestorId: data.parentId,
        descendantId: newDepartment.id,
        relDepth: 1,
      });

      await db.deptAncestry.createMany({ data: newAncestries });
    }

    return newDepartment;
  }

  /**
   * 更新现有单位，并在parentId更改时管理DeptAncestry关系。
   * @param data - 用于更新现有单位的数据。
   * @returns 更新后的单位对象。
   */
  async update(data: z.infer<typeof DepartmentSchema.update>) {
    return await db.$transaction(async (transaction) => {
      const currentDepartment = await transaction.department.findUnique({
        where: { id: data.id },
      });
      if (!currentDepartment) throw new Error('Department not found');

      const updatedDepartment = await transaction.department.update({
        where: { id: data.id },
        data: data,
      });

      if (data.parentId !== currentDepartment.parentId) {
        await transaction.deptAncestry.deleteMany({
          where: { descendantId: data.id },
        });

        if (data.parentId) {
          const parentAncestries = await transaction.deptAncestry.findMany({
            where: { descendantId: data.parentId },
          });

          const newAncestries = parentAncestries.map((ancestry) => ({
            ancestorId: ancestry.ancestorId,
            descendantId: data.id,
            relDepth: ancestry.relDepth + 1,
          }));

          newAncestries.push({
            ancestorId: data.parentId,
            descendantId: data.id,
            relDepth: 1,
          });

          await transaction.deptAncestry.createMany({ data: newAncestries });
        }
      }

      return updatedDepartment;
    });
  }

  /**
   * 删除现有单位并清理DeptAncestry关系。
   * @param data - 用于删除现有单位的数据。
   * @returns 删除的单位对象。
   */
  async delete(data: z.infer<typeof DepartmentSchema.delete>) {
    const deletedDepartment = await db.department.update({
      where: { id: data.id },
      data: { deletedAt: new Date() },
    });

    await db.deptAncestry.deleteMany({
      where: { OR: [{ ancestorId: data.id }, { descendantId: data.id }] },
    });
    return deletedDepartment;
  }
  async getStaffsByDeptIds(ids: string[]) {
    const depts = await db.department.findMany({
      where: { id: { in: ids } },
      include: { deptStaffs: true },
    });
    return depts.flatMap((dept) => dept.deptStaffs);
  }
  /**
   * 获取指定部门及其所有子部门的员工。
   * @param deptIds - 要获取员工ID的部门ID数组。
   * @returns 包含所有员工ID的数组。
   */
  async getAllStaffsByDepts(deptIds: string[]) {
    const allDeptIds = new Set(deptIds);
    for (const deptId of deptIds) {
      const childDeptIds = await this.getAllChildDeptIds(deptId);
      childDeptIds.forEach((id) => allDeptIds.add(id));
    }
    return await this.getStaffsByDeptIds(Array.from(allDeptIds));
  }

  /**
  * 根据部门名称和域ID获取部门ID。
  * 
  * @param {string} name - 部门名称。
  * @param {string} domainId - 域标识符。
  * @returns {Promise<string | null>} - 如果找到则返回部门ID，否则返回null。
  */
  async getDeptIdByName(name: string, domainId: string): Promise<string | null> {
    const dept = await db.department.findFirst({
      where: {
        name,
        ancestors: {
          some: {
            ancestorId: domainId
          }
        }
      }
    });
    return dept ? dept.id : null;
  }

  /**
   * 根据部门名称列表和域ID获取多个部门的ID。
   * 
   * @param {string[]} names - 部门名称列表。
   * @param {string} domainId - 域标识符。
   * @returns {Promise<Record<string, string | null>>} - 一个从部门名称到对应ID或null的记录。
   */
  async getDeptIdsByNames(names: string[], domainId: string): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {};

    // 遍历每个部门名称并获取对应的部门ID
    for (const name of names) {
      // 使用之前定义的函数根据名称获取部门ID
      const deptId = await this.getDeptIdByName(name, domainId);
      result[name] = deptId;
    }

    return result;
  }


}
