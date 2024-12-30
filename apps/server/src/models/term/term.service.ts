import { Injectable } from '@nestjs/common';
import {
  TermMethodSchema,
  db,
  Staff,
  Term,
  Prisma,
  TermDto,
  TreeDataNode,
  UserProfile,
  getUniqueItems,
  RolePerms,
  TaxonomySlug,
  ObjectType,
  TermAncestry,
} from '@nicestack/common';
import { z } from 'zod';
import { BaseTreeService } from '../base/base.tree.service';
import EventBus, { CrudOperation } from '@server/utils/event-bus';
import { formatToTermTreeData, mapToTermSimpleTree } from './utils';

@Injectable()
export class TermService extends BaseTreeService<Prisma.TermDelegate> {
  constructor() {
    super(db, ObjectType.TERM, 'termAncestry', true);
  }

  async create(args: Prisma.TermCreateArgs, params?: { staff?: UserProfile }) {
    args.data.createdBy = params?.staff?.id;
    const result = await super.create(args);
    EventBus.emit('dataChanged', {
      type: this.objectType,
      operation: CrudOperation.CREATED,
      data: result,
    });
    return result;
  }
  async update(args: Prisma.TermUpdateArgs) {
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

  // async query(data: z.infer<typeof TermMethodSchema.findManyWithCursor>) {
  //   const { limit = 10, initialIds, taxonomyId, taxonomySlug } = data;
  //   // Fetch additional objects excluding initialIds
  //   const ids =
  //     typeof initialIds === 'string' ? [initialIds] : initialIds || [];
  //   const initialTerms = await db.term.findMany({
  //     where: {
  //       id: {
  //         in: ids,
  //       },
  //     },
  //     include: {
  //       domain: true,
  //       children: true,
  //     },
  //   });
  //   const terms = await db.term.findMany({
  //     where: {
  //       taxonomyId,
  //       taxonomy: taxonomySlug && { slug: taxonomySlug },
  //       deletedAt: null,
  //     },
  //     take: limit !== -1 ? limit! : undefined,
  //     include: {
  //       domain: true,
  //       taxonomy: true,
  //     },
  //     orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  //   });

  //   const results = getUniqueItems(
  //     [...initialTerms, ...terms].filter(Boolean),
  //     'id',
  //   );
  //   return results;
  // }
  // /**

  async upsertTags(staff: UserProfile, tags: string[]) {
    const tagTax = await db.taxonomy.findFirst({
      where: {
        slug: TaxonomySlug.TAG,
      },
    });
    // 批量查找所有存在的标签
    const existingTerms = await db.term.findMany({
      where: {
        name: {
          in: tags,
        },
        taxonomyId: tagTax.id,
      },
    });

    // 找出不存在的标签
    const existingTagNames = new Set(existingTerms.map((term) => term.name));
    const newTags = tags.filter((tag) => !existingTagNames.has(tag));
    // 批量创建不存在的标签
    const newTerms = await Promise.all(
      newTags.map((tag) =>
        this.create({
          data: {
            name: tag,
            taxonomyId: tagTax.id,
            domainId: staff.domainId,
          },
        }),
      ),
    );

    // 合并现有标签和新创建的标签
    return [...existingTerms, ...newTerms];
  }

  // /**
  //  * 查找多个术语并生成TermDto对象。
  //  *
  //  * @param staff 当前操作的工作人员
  //  * @param ids 术语ID
  //  * @returns 包含详细信息的术语对象
  //  */
  // async findByIds(ids: string[], staff?: UserProfile) {
  //   const terms = await db.term.findMany({
  //     where: {
  //       id: {
  //         in: ids,
  //       },
  //     },
  //     include: {
  //       domain: true,
  //       children: true,
  //     },
  //   });
  //   return await Promise.all(
  //     terms.map(async (term) => {
  //       return await this.transformDto(term, staff);
  //     }),
  //   );
  // }
  // /**
  //  * 获取指定条件下的术语子节点。
  //  *
  //  * @param staff 当前操作的工作人员
  //  * @param data 查询条件
  //  * @returns 子节点术语列表
  //  */
  // async getChildren(
  //   staff: UserProfile,
  //   data: z.infer<typeof TermMethodSchema.getChildren>,
  // ) {
  //   const { parentId, domainId, taxonomyId, cursor, limit = 10 } = data;
  //   let queryCondition: Prisma.TermWhereInput = {
  //     taxonomyId,
  //     parentId: parentId,
  //     OR: [{ domainId: null }],
  //     deletedAt: null,
  //   };
  //   if (
  //     staff?.permissions?.includes(RolePerms.MANAGE_ANY_TERM) ||
  //     staff?.permissions?.includes(RolePerms.READ_ANY_TERM)
  //   ) {
  //     queryCondition.OR = undefined;
  //   } else {
  //     queryCondition.OR = queryCondition.OR.concat([
  //       { domainId: staff?.domainId },
  //       { domainId: null },
  //     ]);
  //   }
  //   const terms = await db.term.findMany({
  //     where: queryCondition,
  //     include: {
  //       children: {
  //         where: {
  //           deletedAt: null,
  //         },
  //       },
  //     },
  //     take: limit + 1,
  //     cursor: cursor
  //       ? { createdAt: cursor.split('_')[0], id: cursor.split('_')[1] }
  //       : undefined,
  //   });
  //   let nextCursor: typeof cursor | undefined = undefined;
  //   if (terms.length > limit) {
  //     const nextItem = terms.pop();
  //     nextCursor = `${nextItem.createdAt.toISOString()}_${nextItem!.id}`;
  //   }
  //   const termDtos = await Promise.all(
  //     terms.map((item) => this.transformDto(item, staff)),
  //   );
  //   return {
  //     items: termDtos,
  //     nextCursor,
  //   };
  // }

  async getTreeData(data: z.infer<typeof TermMethodSchema.getTreeData>) {
    const { taxonomyId, taxonomySlug, domainId } = data;
    let terms = [];
    if (taxonomyId) {
      terms = await db.term.findMany({
        where: { taxonomyId, domainId, deletedAt: null },
        include: { children: true },
        orderBy: [{ order: 'asc' }],
      });
    } else if (taxonomySlug) {
      terms = await db.term.findMany({
        where: {
          taxonomy: {
            slug: taxonomySlug,
          },
          deletedAt: null,
          domainId,
        },
        include: { children: true },
        orderBy: [{ order: 'asc' }],
      });
    }
    // Map to store terms by id for quick lookup
    const termMap = new Map<string, any>();
    terms.forEach((term) =>
      termMap.set(term.id, {
        ...term,
        children: [],
        key: term.id,
        value: term.id,
        title: term.name,
        isLeaf: true, // Initialize as true, will update later if it has children
      }),
    );
    // Root nodes collection
    const roots = [];
    // Build the tree structure iteratively
    terms.forEach((term) => {
      if (term.parentId) {
        const parent = termMap.get(term.parentId);
        if (parent) {
          parent.children.push(termMap.get(term.id));
          parent.isLeaf = false; // Update parent's isLeaf field
        }
      } else {
        roots.push(termMap.get(term.id));
      }
    });
    return roots as TreeDataNode[];
  }

  async getChildSimpleTree(
    staff: UserProfile,
    data: z.infer<typeof TermMethodSchema.getSimpleTree>,
  ) {
    const { domainId = null, permissions } = staff;
    const hasAnyPerms =
      staff?.permissions?.includes(RolePerms.MANAGE_ANY_TERM) ||
      staff?.permissions?.includes(RolePerms.READ_ANY_TERM);
    const { termIds, parentId, taxonomyId } = data;
    // 提取非空 deptIds
    const validTermIds = termIds?.filter((id) => id !== null) ?? [];
    const hasNullTermId = termIds?.includes(null) ?? false;

    const [childrenData, selfData] = await Promise.all([
      db.termAncestry.findMany({
        where: {
          ...(termIds && {
            OR: [
              ...(validTermIds.length
                ? [{ ancestorId: { in: validTermIds } }]
                : []),
              ...(hasNullTermId ? [{ ancestorId: null }] : []),
            ],
          }),
          descendant: {
            taxonomyId: taxonomyId,
            // 动态权限控制条件
            ...(hasAnyPerms
              ? {} // 当有全局权限时，不添加任何额外条件
              : {
                  // 当无全局权限时，添加域ID过滤
                  OR: [
                    { domainId: null }, // 通用记录
                    { domainId: domainId }, // 特定域记录
                  ],
                }),
          },
          ancestorId: parentId,
          relDepth: 1,
        },
        include: {
          descendant: { include: { children: true } },
        },
        orderBy: { descendant: { order: 'asc' } },
      }),
      termIds
        ? db.term.findMany({
            where: {
              ...(termIds && {
                OR: [
                  ...(validTermIds.length
                    ? [{ id: { in: validTermIds } }]
                    : []),
                ],
              }),
              taxonomyId: taxonomyId,
              // 动态权限控制条件
              ...(hasAnyPerms
                ? {} // 当有全局权限时，不添加任何额外条件
                : {
                    // 当无全局权限时，添加域ID过滤
                    OR: [
                      { domainId: null }, // 通用记录
                      { domainId: domainId }, // 特定域记录
                    ],
                  }),
            },
            include: { children: true },
            orderBy: { order: 'asc' },
          })
        : [],
    ]);
    const children = childrenData
      .map(({ descendant }) => descendant)
      .filter(Boolean)
      .map(formatToTermTreeData);
    const selfItems = selfData.map(formatToTermTreeData);
    return getUniqueItems([...children, ...selfItems], 'id');
  }

  async getParentSimpleTree(
    staff: UserProfile,
    data: z.infer<typeof TermMethodSchema.getSimpleTree>,
  ) {
    const { domainId = null, permissions } = staff;
    const hasAnyPerms =
      permissions.includes(RolePerms.READ_ANY_TERM) ||
      permissions.includes(RolePerms.MANAGE_ANY_TERM);
    // 解构输入参数
    const { termIds, taxonomyId } = data;

    // 并行查询父级部门ancestry和自身部门数据
    // 使用Promise.all提高查询效率,减少等待时间
    const [parentData, selfData] = await Promise.all([
      // 查询指定部门的所有祖先节点,包含子节点和父节点信息
      db.termAncestry.findMany({
        where: {
          descendantId: { in: termIds }, // 查询条件:descendant在给定的部门ID列表中
          ancestor: {
            taxonomyId: taxonomyId,
            ...(hasAnyPerms
              ? {} // 当有全局权限时，不添加任何额外条件
              : {
                  // 当无全局权限时，添加域ID过滤
                  OR: [
                    { domainId: null }, // 通用记录
                    { domainId: domainId }, // 特定域记录
                  ],
                }),
          },
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
      db.term.findMany({
        where: {
          id: { in: termIds },
          taxonomyId: taxonomyId,
          ...(hasAnyPerms
            ? {} // 当有全局权限时，不添加任何额外条件
            : {
                // 当无全局权限时，添加域ID过滤
                OR: [
                  { domainId: null }, // 通用记录
                  { domainId: domainId }, // 特定域记录
                ],
              }),
        },
        include: { children: true }, // 包含子节点信息
        orderBy: { order: 'asc' }, // 按顺序升序排序
      }),
    ]);

    // 处理父级节点:过滤并映射为简单树结构
    const parents = parentData
      .map(({ ancestor }) => ancestor) // 提取祖先节点
      .filter((ancestor) => ancestor) // 过滤有效且超出根节点层级的节点
      .map(mapToTermSimpleTree); // 映射为简单树结构

    // 处理自身节点:映射为简单树结构
    const selfItems = selfData.map(mapToTermSimpleTree);

    // 合并并去重父级和自身节点,返回唯一项
    return getUniqueItems([...parents, ...selfItems], 'id');
  }
}
