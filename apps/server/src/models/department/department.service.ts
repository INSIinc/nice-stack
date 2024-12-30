import { Injectable } from '@nestjs/common';
import {
  db,
  DepartmentMethodSchema,
  DeptAncestry,
  getUniqueItems,
  ObjectType,
  Prisma,
} from '@nicestack/common';
import { BaseTreeService } from '../base/base.tree.service';
import { z } from 'zod';
import { mapToDeptSimpleTree, getStaffsByDeptIds } from './utils';
import EventBus, { CrudOperation } from '@server/utils/event-bus';
@Injectable()
export class DepartmentService extends BaseTreeService<Prisma.DepartmentDelegate> {
  constructor() {
    super(db, ObjectType.DEPARTMENT, 'deptAncestry', true);
  }
  async getDescendantIdsInDomain(
    ancestorId: string,
    includeAncestor = true,
  ): Promise<string[]> {
    // 如果没有提供部门ID，返回空数组
    if (!ancestorId) return [];
    // 获取祖先部门信息
    const ancestorDepartment = await db.department.findUnique({
      where: { id: ancestorId },
    });

    // 如果未找到部门，返回空数组
    if (!ancestorDepartment) return [];

    // 查询同域下以指定部门为祖先的部门血缘关系
    const departmentAncestries = await db.deptAncestry.findMany({
      where: {
        ancestorId: ancestorId,
        descendant: {
          domainId: ancestorDepartment.domainId,
        },
      },
    });
    // 提取子部门ID列表
    let descendantDepartmentIds = departmentAncestries.map(
      (ancestry) => ancestry.descendantId,
    );
    // 根据参数决定是否包含祖先部门ID
    if (includeAncestor && ancestorId) {
      descendantDepartmentIds.push(ancestorId);
    }
    return descendantDepartmentIds;
  }
  async getDescendantDomainIds(
    ancestorDomainId: string,
    includeAncestorDomain = true,
  ): Promise<string[]> {
    if (!ancestorDomainId) return [];
    // 查询所有以指定域ID为祖先的域的血缘关系
    const domainAncestries = await db.deptAncestry.findMany({
      where: {
        ancestorId: ancestorDomainId,
        descendant: {
          isDomain: true,
        },
      },
    });

    // 提取子域的ID列表
    let descendantDomainIds = domainAncestries.map(
      (ancestry) => ancestry.descendantId,
    );
    // 根据参数决定是否包含祖先域ID
    if (includeAncestorDomain && ancestorDomainId) {
      descendantDomainIds.push(ancestorDomainId);
    }

    return descendantDomainIds;
  }
  /**
   * 获取指定DOM下的对应name的单位
   * @param domainId
   * @param name
   * @returns
   */
  async findInDomain(domainId: string, name: string) {
    const subDepts = await db.deptAncestry.findMany({
      where: {
        ancestorId: domainId,
      },
      include: {
        descendant: true,
      },
    });
    const dept = subDepts.find((item) => item.descendant.name === name);

    return dept.descendant;
  }

  private async setDomainId(parentId: string) {
    const parent = await this.findUnique({ where: { id: parentId } });
    return parent.isDomain ? parentId : parent.domainId;
  }

  async create(args: Prisma.DepartmentCreateArgs) {
    if (args.data.parentId) {
      args.data.domainId = await this.setDomainId(args.data.parentId);
    }
    const result = await super.create(args);
    EventBus.emit('dataChanged', {
      type: this.objectType,
      operation: CrudOperation.CREATED,
      data: result,
    });
    return result;
  }

  async update(args: Prisma.DepartmentUpdateArgs) {
    if (args.data.parentId) {
      args.data.domainId = await this.setDomainId(args.data.parentId as string);
    }
    const result = await super.update(args);
    EventBus.emit('dataChanged', {
      type: this.objectType,
      operation: CrudOperation.UPDATED,
      data: result,
    });
    return result;
  }

  /**
   * 删除现有单位并清理DeptAncestry关系。
   * @param data - 用于删除现有单位的数据。
   * @returns 删除的单位对象。
   */
  async softDeleteByIds(ids: string[]) {
    const descendantIds = await this.getDescendantIds(ids, true);
    const result = await super.softDeleteByIds(descendantIds);
    EventBus.emit('dataChanged', {
      type: this.objectType,
      operation: CrudOperation.DELETED,
      data: result,
    });
    return result;
  }

  /**
   * 获取指定部门及其所有子部门的员工。
   * @param deptIds - 要获取员工ID的部门ID数组。
   * @returns 包含所有员工ID的数组。
   */
  async getStaffsInDepts(deptIds: string[]) {
    const allDeptIds = await this.getDescendantIds(deptIds, true);
    return await getStaffsByDeptIds(Array.from(allDeptIds));
  }
  async getStaffIdsInDepts(deptIds: string[]) {
    const result = await this.getStaffsInDepts(deptIds);
    return result.map((s) => s.id);
  }
  /**
   * 根据部门名称列表和域ID获取多个部门的ID。
   *
   * @param {string[]} names - 部门名称列表
   * @param {string} domainId - 域ID
   * @returns {Promise<Record<string, string | null>>} - 返回一个对象，键为部门名称，值为部门ID或null
   */
  async getDeptIdsByNames(
    names: string[],
    domainId: string,
  ): Promise<Record<string, string | null>> {
    // 使用 Prisma 的 findMany 方法批量查询部门信息，优化性能
    const depts = await db.department.findMany({
      where: {
        // 查询条件：部门名称在给定的名称列表中
        name: { in: names },
        // 查询条件：部门在指定的域下（通过ancestors关系查询）
        ancestors: {
          some: {
            ancestorId: domainId,
          },
        },
      },
      // 选择查询的字段：只查询部门的id和name字段
      select: {
        id: true,
        name: true,
      },
    });

    // 创建一个Map对象，将部门名称映射到部门ID
    const deptMap = new Map(depts.map((dept) => [dept.name, dept.id]));

    // 初始化结果对象，用于存储最终的结果
    const result: Record<string, string | null> = {};

    // 遍历传入的部门名称列表
    for (const name of names) {
      // 从Map中获取部门ID，如果不存在则返回null
      result[name] = deptMap.get(name) || null;
    }

    // 返回最终的结果对象
    return result;
  }

  async getChildSimpleTree(
    data: z.infer<typeof DepartmentMethodSchema.getSimpleTree>,
  ) {
    const { domain, deptIds, rootId } = data;
    // 提取非空 deptIds
    const validDeptIds = deptIds?.filter((id) => id !== null) ?? [];
    const hasNullDeptId = deptIds?.includes(null) ?? false;
    const [childrenData, selfData] = await Promise.all([
      db.deptAncestry.findMany({
        where: {
          ...(deptIds && {
            OR: [
              ...(validDeptIds.length
                ? [{ ancestorId: { in: validDeptIds } }]
                : []),
              ...(hasNullDeptId ? [{ ancestorId: null }] : []),
            ],
          }),
          ancestorId: rootId,
          relDepth: 1,
          descendant: { isDomain: domain },
        },
        include: {
          descendant: { include: { children: true, deptStaffs: true } },
        },
        orderBy: { descendant: { order: 'asc' } },
      }),
      deptIds
        ? db.department.findMany({
            where: {
              ...(deptIds && {
                OR: [
                  ...(validDeptIds.length
                    ? [{ id: { in: validDeptIds } }]
                    : []),
                ],
              }),
              isDomain: domain,
            },
            include: { children: true },
            orderBy: { order: 'asc' },
          })
        : [],
    ]);
    const children = childrenData
      .map(({ descendant }) => descendant)
      .filter(Boolean)
      .map(mapToDeptSimpleTree);
    const selfItems = selfData.map(mapToDeptSimpleTree);
    return getUniqueItems([...children, ...selfItems], 'id');
  }

  /**
   * 获取父级部门简单树结构的异步方法
   *
   * @param data - 包含部门ID、域和根ID的输入参数
   * @returns 返回唯一的部门简单树结构数组
   *
   * 方法整体设计思路:
   * 1. 并行查询父级部门ancestry和自身部门数据
   * 2. 查询根节点的直接子节点
   * 3. 通过自定义过滤函数筛选超出根节点层级的祖先节点
   * 4. 将查询结果映射为简单树结构
   * 5. 去重并返回最终结果
   */
  async getParentSimpleTree(
    data: z.infer<typeof DepartmentMethodSchema.getSimpleTree>,
  ) {
    // 解构输入参数
    const { deptIds, domain, rootId } = data;
    // 并行查询父级部门ancestry和自身部门数据
    // 使用Promise.all提高查询效率,减少等待时间
    const [parentData, selfData] = await Promise.all([
      // 查询指定部门的所有祖先节点,包含子节点和父节点信息
      db.deptAncestry.findMany({
        where: {
          descendantId: { in: deptIds }, // 查询条件:descendant在给定的部门ID列表中
          ancestor: { isDomain: domain }, // 限定域
        },
        include: {
          ancestor: {
            include: {
              children: true, // 包含子节点信息
              parent: true, // 包含父节点信息
            },
          },
        },
        orderBy: { ancestor: { order: 'asc' } }, // 按祖先节点顺序升序排序
      }),

      // 查询自身部门数据
      db.department.findMany({
        where: { id: { in: deptIds }, isDomain: domain },
        include: { children: true }, // 包含子节点信息
        orderBy: { order: 'asc' }, // 按顺序升序排序
      }),
    ]);

    // 查询根节点的直接子节点
    const rootChildren = await db.deptAncestry.findMany({
      where: {
        ancestorId: rootId, // 祖先ID为根ID
        descendant: { isDomain: domain }, // 限定域
      },
    });

    /**
     * 判断祖先节点是否超出根节点层级的函数
     *
     * @param ancestor - 祖先节点
     * @returns 是否超出根节点层级
     */
    const isDirectDescendantOfRoot = (ancestor: DeptAncestry): boolean => {
      return (
        rootChildren.findIndex(
          (child) => child.descendantId === ancestor.ancestorId,
        ) !== -1
      );
    };

    // 处理父级节点:过滤并映射为简单树结构
    const parents = parentData
      .map(({ ancestor }) => ancestor) // 提取祖先节点
      .filter(
        (ancestor) => ancestor && isDirectDescendantOfRoot(ancestor as any),
      ) // 过滤有效且超出根节点层级的节点
      .map(mapToDeptSimpleTree); // 映射为简单树结构

    // 处理自身节点:映射为简单树结构
    const selfItems = selfData.map(mapToDeptSimpleTree);

    // 合并并去重父级和自身节点,返回唯一项
    return getUniqueItems([...parents, ...selfItems], 'id');
  }
}
