import { Prisma, PrismaClient } from '@nicestack/common';
import { BaseService } from "./base.service";
import { DataArgs, DelegateArgs, DelegateFuncs, DelegateReturnTypes, UpdateOrderArgs } from "./base.type";

/**
 * BaseTreeService provides a generic CRUD interface for a tree prisma model.
 * It enables common data operations such as find, create, update, and delete.
 *
 * @template D - Type for the model delegate, defining available operations.
 * @template A - Arguments for the model delegate's operations.
 * @template R - Return types for the model delegate's operations.
 */
export class BaseTreeService<
    D extends DelegateFuncs,
    A extends DelegateArgs<D> = DelegateArgs<D>,
    R extends DelegateReturnTypes<D> = DelegateReturnTypes<D>,
> extends BaseService<D, A, R> {

    constructor(
        protected prisma: PrismaClient,
        protected objectType: string,
        protected ancestryType: string = objectType + 'Ancestry',
        protected enableOrder: boolean = false
    ) {
        super(prisma, objectType, enableOrder)
    }
    async getNextOrder(
        transaction: any,
        parentId: string | null,
        parentOrder?: number
    ): Promise<number> {
        // 查找同层级最后一个节点的 order
        const lastOrder = await transaction[this.objectType].findFirst({
            where: {
                parentId: parentId ?? null
            },
            select: { order: true },
            orderBy: { order: 'desc' },
        } as any);

        // 如果有父节点
        if (parentId) {
            // 获取父节点的 order（如果未提供）
            const parentNodeOrder = parentOrder ?? (
                await transaction[this.objectType].findUnique({
                    where: { id: parentId },
                    select: { order: true }
                })
            )?.order ?? 0;

            // 如果存在最后一个同层级节点，确保新节点 order 大于最后一个节点
            // 否则，新节点 order 设置为父节点 order + 1
            return lastOrder
                ? Math.max(lastOrder.order + this.ORDER_INTERVAL,
                    parentNodeOrder + this.ORDER_INTERVAL)
                : parentNodeOrder + this.ORDER_INTERVAL;
        }

        // 对于根节点，直接使用最后一个节点的 order + 1
        return lastOrder?.order ? lastOrder?.order + this.ORDER_INTERVAL : 1;
    }

    async create(args: A['create']) {
        const anyArgs = args as any
        return this.prisma.$transaction(async (transaction) => {
            if (this.enableOrder) {
                // 获取新节点的 order
                anyArgs.data.order = await this.getNextOrder(
                    transaction,
                    anyArgs?.data.parentId ?? null
                );
            }
            // 创建节点
            const result: any = await super.create(anyArgs, { tx: transaction });

            // 更新父节点的 hasChildren 状态
            if (anyArgs.data.parentId) {
                await transaction[this.objectType].update({
                    where: { id: anyArgs.data.parentId },
                    data: { hasChildren: true }
                });
            }

            // 创建祖先关系
            const newAncestries = anyArgs.data.parentId
                ? [
                    ...(
                        await transaction[this.ancestryType].findMany({
                            where: { descendantId: anyArgs.data.parentId },
                            select: { ancestorId: true, relDepth: true },
                        })
                    ).map(({ ancestorId, relDepth }) => ({
                        ancestorId,
                        descendantId: result.id,
                        relDepth: relDepth + 1,
                    })),
                    {
                        ancestorId: result.parentId,
                        descendantId: result.id,
                        relDepth: 1,
                    },
                ]
                : [{ ancestorId: null, descendantId: result.id, relDepth: 1 }];

            await transaction[this.ancestryType].createMany({ data: newAncestries });

            return result;
        }) as Promise<R['create']>;
    }


    /**
 * 更新现有单位，并在parentId更改时管理DeptAncestry关系。
 * @param data - 用于更新现有单位的数据。
 * @returns 更新后的单位对象。
 */
    async update(args: A['update']) {
        const anyArgs = args as any
        return this.prisma.$transaction(async (transaction) => {
            const current = await transaction[this.objectType].findUnique({
                where: { id: anyArgs.where.id },
            });

            if (!current) throw new Error('object not found');

            const result: any = await super.update(anyArgs, { tx: transaction });

            if (anyArgs.data.parentId !== current.parentId) {
                await transaction[this.ancestryType].deleteMany({
                    where: { descendantId: result.id },
                });
                // 更新原父级的 hasChildren 状态
                if (current.parentId) {
                    const childrenCount = await transaction[this.objectType].count({
                        where: { parentId: current.parentId, deletedAt: null }
                    });

                    if (childrenCount === 0) {
                        await transaction[this.objectType].update({
                            where: { id: current.parentId },
                            data: { hasChildren: false }
                        });
                    }
                }
                if (anyArgs.data.parentId) {
                    await transaction[this.objectType].update({
                        where: { id: anyArgs.data.parentId },
                        data: { hasChildren: true }
                    });
                    const parentAncestries = await transaction[this.ancestryType].findMany({
                        where: { descendantId: anyArgs.data.parentId },
                    });

                    const newAncestries = parentAncestries.map(
                        ({ ancestorId, relDepth }) => ({
                            ancestorId,
                            descendantId: result.id,
                            relDepth: relDepth + 1,
                        }),
                    );

                    newAncestries.push({
                        ancestorId: anyArgs.data.parentId,
                        descendantId: result.id,
                        relDepth: 1,
                    });

                    await transaction[this.ancestryType].createMany({ data: newAncestries });
                } else {
                    await transaction[this.ancestryType].create({
                        data: { ancestorId: null, descendantId: result.id, relDepth: 0 },
                    });
                }
            }

            return result;
        }) as Promise<R['update']>;
    }
    /**
     * Soft deletes records by setting `isDeleted` to true for the given IDs.
     * @param ids - An array of IDs of the records to soft delete.
     * @param data - Additional data to update on soft delete.  (Optional)
     * @returns {Promise<R['update'][]>} - A promise resolving to an array of updated records.
     * @example
     * const softDeletedUsers = await service.softDeleteByIds(['user_id1', 'user_id2'], { reason: 'Bulk deletion' });
     */
    async softDeleteByIds(
        ids: string[],
        data: Partial<DataArgs<A['update']>> = {}, // Default to empty object
    ): Promise<R['update'][]> {
        return this.prisma.$transaction(async tx => {
            // 首先找出所有需要软删除的记录的父级ID
            const parentIds = await tx[this.objectType].findMany({
                where: {
                    id: { in: ids },
                    parentId: { not: null }
                },
                select: { parentId: true }
            });

            const uniqueParentIds = [...new Set(parentIds.map(p => p.parentId))];

            // 执行软删除
            const result = await super.softDeleteByIds(ids, data);

            // 删除相关的祖先关系
            await tx[this.ancestryType].deleteMany({
                where: {
                    OR: [
                        { ancestorId: { in: ids } },
                        { descendantId: { in: ids } },
                    ],
                }
            });
            // 更新父级的 hasChildren 状态
            if (uniqueParentIds.length > 0) {
                for (const parentId of uniqueParentIds) {
                    const remainingChildrenCount = await tx[this.objectType].count({
                        where: {
                            parentId: parentId,
                            deletedAt: null
                        }
                    });
                    if (remainingChildrenCount === 0) {
                        await tx[this.objectType].update({
                            where: { id: parentId },
                            data: { hasChildren: false }
                        });
                    }
                }
            }

            return result;
        }) as Promise<R['update'][]>;
    }


    getAncestors(ids: string[]) {
        if (!ids || ids.length === 0) return [];
        const validIds = ids.filter(id => id != null);
        const hasNull = ids.includes(null)
        return this.prisma[this.ancestryType].findMany({
            where: {
                OR: [
                    { ancestorId: { in: validIds } },
                    { ancestorId: hasNull ? null : undefined },
                ]
            },
        });
    }

    getDescendants(ids: string[]) {
        if (!ids || ids.length === 0) return [];
        const validIds = ids.filter(id => id != null);
        const hasNull = ids.includes(null)
        return this.prisma[this.ancestryType].findMany({
            where: {
                OR: [
                    { ancestorId: { in: validIds } },
                    { ancestorId: hasNull ? null : undefined },
                ]
            },
        });
    }

    async getDescendantIds(ids: string | string[], includeOriginalIds: boolean = false): Promise<string[]> {
        // 将单个 ID 转换为数组
        const idArray = Array.isArray(ids) ? ids : [ids];

        const res = await this.getDescendants(idArray);
        const descendantSet = new Set(res?.map((item) => item.descendantId) || []);

        if (includeOriginalIds) {
            idArray.forEach(id => descendantSet.add(id));
        }

        return Array.from(descendantSet).filter(Boolean) as string[];
    }

    async getAncestorIds(ids: string | string[], includeOriginalIds: boolean = false): Promise<string[]> {
        // 将单个 ID 转换为数组
        const idArray = Array.isArray(ids) ? ids : [ids];

        const res = await this.getDescendants(idArray);
        const ancestorSet = new Set<string>();

        // 按深度排序并添加祖先ID
        res
            ?.sort((a, b) => b.relDepth - a.relDepth)
            ?.forEach((item) => ancestorSet.add(item.ancestorId));

        // 根据参数决定是否添加原始ID
        if (includeOriginalIds) {
            idArray.forEach((id) => ancestorSet.add(id));
        }

        return Array.from(ancestorSet).filter(Boolean) as string[];
    }
    async updateOrder(args: UpdateOrderArgs) {
        const { id, overId } = args;

        return this.prisma.$transaction(async (transaction) => {
            // 查找当前节点和目标节点
            const currentObject = await transaction[this.objectType].findUnique({
                where: { id },
                select: { id: true, parentId: true, order: true }
            });

            const targetObject = await transaction[this.objectType].findUnique({
                where: { id: overId },
                select: { id: true, parentId: true, order: true }
            });

            // 验证节点
            if (!currentObject || !targetObject) {
                throw new Error('Invalid object or target object');
            }

            // 查找父节点
            const parentObject = currentObject.parentId
                ? await transaction[this.objectType].findUnique({
                    where: { id: currentObject.parentId },
                    select: { id: true, order: true }
                })
                : null;

            // 确保在同一父节点下移动
            if (currentObject.parentId !== targetObject.parentId) {
                throw new Error('Cannot move between different parent nodes');
            }

            // 查找同层级的所有节点，按 order 排序
            const siblingNodes = await transaction[this.objectType].findMany({
                where: {
                    parentId: targetObject.parentId
                },
                select: { id: true, order: true },
                orderBy: { order: 'asc' }
            });

            // 找到目标节点和当前节点在兄弟节点中的索引
            const targetIndex = siblingNodes.findIndex(node => node.id === targetObject.id);
            const currentIndex = siblingNodes.findIndex(node => node.id === currentObject.id);

            // 移除当前节点
            siblingNodes.splice(currentIndex, 1);

            // 在目标位置插入当前节点
            const insertIndex = currentIndex > targetIndex ? targetIndex + 1 : targetIndex;
            siblingNodes.splice(insertIndex, 0, currentObject);


            // 重新分配 order
            const newOrders = this.redistributeOrder(siblingNodes, parentObject?.order || 0);

            // 批量更新节点的 order
            const updatePromises = newOrders.map((nodeOrder, index) =>
                transaction[this.objectType].update({
                    where: { id: siblingNodes[index].id },
                    data: { order: nodeOrder }
                })
            );

            await Promise.all(updatePromises);

            // 返回更新后的当前节点
            return transaction[this.objectType].findUnique({
                where: { id: currentObject.id }
            });
        });
    }

    // 重新分配 order 的方法
    private redistributeOrder(nodes: Array<{ id: string, order: number }>, parentOrder: number): number[] {
        const MIN_CHILD_ORDER = parentOrder + this.ORDER_INTERVAL; // 子节点 order 必须大于父节点
        const newOrders: number[] = [];

        nodes.forEach((_, index) => {
            // 使用等差数列分配 order，确保大于父节点
            const nodeOrder = MIN_CHILD_ORDER + (index + 1) * this.ORDER_INTERVAL;
            newOrders.push(nodeOrder);
        });

        return newOrders;
    }



}