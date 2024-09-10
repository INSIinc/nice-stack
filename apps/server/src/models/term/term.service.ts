import { Injectable } from '@nestjs/common';
import { z, TermSchema, db, Staff, Term, RelationType, ObjectType, Prisma, TermDto } from '@nicestack/common';
import { RolePermsService } from '@server/rbac/roleperms.service';
import { RelationService } from '@server/relation/relation.service';

/**
 * Service for managing terms and their ancestries.
 */
@Injectable()
export class TermService {
    constructor(private readonly permissionService: RolePermsService, private readonly relations: RelationService) { }

    /**
     * 生成TermDto对象，包含权限和关系信息
     * @param staff 当前操作的工作人员
     * @param term 当前处理的术语对象，包含其子节点
     * @returns 完整的TermDto对象
     */
    async genTermDto(staff: Staff, term: Term & { children: Term[] }): Promise<TermDto> {
        const { children, ...others } = term as any;
        const permissions = this.permissionService.getTermPerms(staff, term);
        const relationTypes = [
            { type: RelationType.WATCH, object: ObjectType.DEPARTMENT, key: 'watchDeptIds', limit: undefined },
            { type: RelationType.WATCH, object: ObjectType.STAFF, key: 'watchStaffIds', limit: undefined }
        ] as const;

        type RelationResult = {
            [key in typeof relationTypes[number]['key']]: string[];
        };

        const promises = relationTypes.map(async ({ type, object, key, limit }) => ({
            [key]: await this.relations.getEROBids(ObjectType.TERM, type, object, term.id, limit)
        }));

        const results = await Promise.all(promises);
        const mergedResults = Object.assign({}, ...(results as Partial<RelationResult>[]));

        return { ...others, ...mergedResults, permissions, hasChildren: term.children.length > 0 };
    }

    /**
     * 获取特定父节点下新的排序值。
     * 
     * @param parentId 父节点ID，如果是根节点则为null
     * @returns 下一个排序值
     */
    private async getNextOrder(parentId?: string) {
        let newOrder = 0;

        if (parentId) {
            const siblingTerms = await db.term.findMany({
                where: { parentId },
                orderBy: { order: 'desc' },
                take: 1,
            });

            if (siblingTerms.length > 0) {
                newOrder = siblingTerms[0].order + 1;
            }
        } else {
            const rootTerms = await db.term.findMany({
                where: { parentId: null },
                orderBy: { order: 'desc' },
                take: 1,
            });

            if (rootTerms.length > 0) {
                newOrder = rootTerms[0].order + 1;
            }
        }

        return newOrder;
    }

    /**
     * 创建关系数据用于批量插入。
     * 
     * @param termId 术语ID
     * @param watchDeptIds 监控部门ID数组
     * @param watchStaffIds 监控员工ID数组
     * @returns 关系数据数组
     */
    private createRelations(
        termId: string,
        watchDeptIds: string[],
        watchStaffIds: string[]
    ) {
        const relationsData = [
            ...watchDeptIds.map(bId => this.relations.buildRelation(termId, bId, ObjectType.TERM, ObjectType.DEPARTMENT, RelationType.WATCH)),
            ...watchStaffIds.map(bId => this.relations.buildRelation(termId, bId, ObjectType.TERM, ObjectType.STAFF, RelationType.WATCH)),
        ];
        return relationsData;
    }

    /**
     * 创建一个新的术语并根据需要创建祖先关系。
     * 
     * @param data 创建新术语的数据
     * @returns 新创建的术语
     */
    async create(staff: Staff, data: z.infer<typeof TermSchema.create>) {
        const { parentId, watchDeptIds = [], watchStaffIds = [], ...others } = data;

        return await db.$transaction(async (trx) => {
            const order = await this.getNextOrder(parentId);

            const newTerm = await trx.term.create({
                data: {
                    ...others,
                    parentId,
                    order,
                    createdBy: staff.id
                },
            });

            if (parentId) {
                const parentTerm = await trx.term.findUnique({
                    where: { id: parentId },
                    include: { ancestors: true },
                });

                const ancestries = parentTerm.ancestors.map((ancestor) => ({
                    ancestorId: ancestor.ancestorId,
                    descendantId: newTerm.id,
                    relDepth: ancestor.relDepth + 1,
                }));

                ancestries.push({
                    ancestorId: parentTerm.id,
                    descendantId: newTerm.id,
                    relDepth: 1,
                });

                await trx.termAncestry.createMany({ data: ancestries });
            }

            const relations = this.createRelations(newTerm.id, watchDeptIds, watchStaffIds);
            await trx.relation.createMany({ data: relations });
            return newTerm;
        });
    }

    /**
     * 更新现有术语的数据，并在parentId改变时管理术语祖先关系。
     * 
     * @param data 更新术语的数据
     * @returns 更新后的术语
     */
    async update(data: z.infer<typeof TermSchema.update>) {
        return await db.$transaction(async (prisma) => {
            const currentTerm = await prisma.term.findUnique({
                where: { id: data.id },
            });
            if (!currentTerm) throw new Error('Term not found');
            console.log(data)
            const updatedTerm = await prisma.term.update({
                where: { id: data.id },
                data,
            });

            if (data.parentId !== currentTerm.parentId) {
                await prisma.termAncestry.deleteMany({
                    where: { descendantId: data.id },
                });

                if (data.parentId) {
                    const parentAncestries = await prisma.termAncestry.findMany({
                        where: { descendantId: data.parentId },
                    });

                    const newAncestries = parentAncestries.map(ancestry => ({
                        ancestorId: ancestry.ancestorId,
                        descendantId: data.id,
                        relDepth: ancestry.relDepth + 1,
                    }));

                    newAncestries.push({
                        ancestorId: data.parentId,
                        descendantId: data.id,
                        relDepth: 1,
                    });

                    await prisma.termAncestry.createMany({
                        data: newAncestries,
                    });

                    const order = await this.getNextOrder(data.parentId);
                    await prisma.term.update({
                        where: { id: data.id },
                        data: { order },
                    });
                }
            }

            if (data.watchDeptIds || data.watchStaffIds) {
                await prisma.relation.deleteMany({ where: { aId: data.id, relationType: { in: [RelationType.WATCH] } } });

                const relations = this.createRelations(
                    data.id,
                    data.watchDeptIds ?? [],
                    data.watchStaffIds ?? []
                );

                await prisma.relation.createMany({ data: relations });
            }

            return updatedTerm;
        });
    }

    /**
     * 根据ID删除现有术语。
     * 
     * @param data 删除术语的数据
     * @returns 被删除的术语
     */
    async delete(data: z.infer<typeof TermSchema.delete>) {
        const { id } = data;

        await db.termAncestry.deleteMany({
            where: { OR: [{ ancestorId: id }, { descendantId: id }] },
        });

        const deletedTerm = await db.term.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });

        return deletedTerm;
    }

    /**
     * 批量删除术语。
     * 
     * @param ids 要删除的术语ID数组
     * @returns 已删除的术语列表
     */
    async batchDelete(ids: string[]) {
        await db.termAncestry.deleteMany({
            where: { OR: [{ ancestorId: { in: ids } }, { descendantId: { in: ids } }] },
        });

        const deletedTerms = await db.term.updateMany({
            where: { id: { in: ids } },
            data: {
                deletedAt: new Date(),
            }
        });

        return deletedTerms;
    }

    /**
     * 查找唯一术语并生成TermDto对象。
     * 
     * @param staff 当前操作的工作人员
     * @param id 术语ID
     * @returns 包含详细信息的术语对象
     */
    async findUnique(staff: Staff, id: string) {
        const term = await db.term.findUnique({
            where: {
                id,
            },
            include: {
                domain: true,
                children: true,
            },
        });
        return await this.genTermDto(staff, term);
    }

    /**
     * 获取指定条件下的术语子节点。
     * 
     * @param staff 当前操作的工作人员
     * @param data 查询条件
     * @returns 子节点术语列表
     */
    async getChildren(staff: Staff, data: z.infer<typeof TermSchema.getChildren>) {
        const { parentId, domainId, taxonomyId, cursor, limit = 10 } = data;
        const extraCondition = await this.permissionService.getTermExtraConditions(staff);
        let queryCondition: Prisma.TermWhereInput = { taxonomyId, parentId: parentId === undefined ? null : parentId, domainId, deletedAt: null }
        const whereCondition: Prisma.TermWhereInput = {
            AND: [extraCondition, queryCondition],
        };
        console.log(JSON.stringify(whereCondition))
        const terms = await db.term.findMany({
            where: whereCondition,
            include: {
                children: {
                    where: {
                        deletedAt: null,
                    },

                }
            },
            take: limit + 1,
            cursor: cursor ? { createdAt: cursor.split('_')[0], id: cursor.split('_')[1] } : undefined,
        });
        let nextCursor: typeof cursor | undefined = undefined;
        if (terms.length > limit) {
            const nextItem = terms.pop();
            nextCursor = `${nextItem.createdAt.toISOString()}_${nextItem!.id}`;
        }
        const termDtos = await Promise.all(terms.map((item) => this.genTermDto(staff, item)));
        return {
            items: termDtos,
            nextCursor,
        };
    }
    /**
 * 获取指定条件下的所有术语子节点。
 * 
 * @param staff 当前操作的工作人员
 * @param data 查询条件
 * @returns 子节点术语列表
 */
    async getAllChildren(staff: Staff, data: z.infer<typeof TermSchema.getChildren>) {
        const { parentId, domainId, taxonomyId } = data;
        const extraCondition = await this.permissionService.getTermExtraConditions(staff);
        let queryCondition: Prisma.TermWhereInput = { taxonomyId, parentId: parentId === undefined ? null : parentId, domainId, deletedAt: null }

        const whereCondition: Prisma.TermWhereInput = {
            AND: [extraCondition, queryCondition],
        };
        console.log(JSON.stringify(whereCondition))
        const terms = await db.term.findMany({
            where: whereCondition,
            include: {
                children: {
                    where: {
                        deletedAt: null,
                    },
                },
            },
        });
        return await Promise.all(terms.map((item) => this.genTermDto(staff, item)));

    }

    /**
    * 根据关键词或ID集合查找术语
    * @param data 包含关键词、域ID和ID集合的对象
    * @returns 匹配的术语记录列表
    */
    async findMany(data: z.infer<typeof TermSchema.findMany>) {
        const { keyword, taxonomyId, ids } = data;

        return await db.term.findMany({
            where: {
                deletedAt: null,
                taxonomyId,
                OR: [
                    { name: { contains: keyword } },
                    {
                        id: { in: ids }
                    }
                ]
            },
            orderBy: { order: "asc" },
            take: 20
        });
    }
}
