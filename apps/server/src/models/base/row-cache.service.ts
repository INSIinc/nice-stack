import { UserProfile, RowModelRequest, RowRequestSchema } from "@nicestack/common";
import { RowModelService } from "./row-model.service";
import { isFieldCondition, LogicalCondition, SQLBuilder } from "./sql-builder";
import EventBus from "@server/utils/event-bus";
import supejson from "superjson-cjs"
import { deleteByPattern } from "@server/utils/redis/utils";
import { redis } from "@server/utils/redis/redis.service";
import { z } from "zod";
export class RowCacheService extends RowModelService {
    constructor(tableName: string, private enableCache: boolean = true) {
        super(tableName)
        if (this.enableCache) {
            EventBus.on("dataChanged", async ({ type, data }) => {
                if (type === tableName) {
                    const dataArray = Array.isArray(data) ? data : [data];
                    for (const item of dataArray) {
                        try {
                            if (item.id) {
                                this.invalidateRowCacheById(item.id)
                            }
                            if (item.parentId) {
                                this.invalidateRowCacheById(item.parentId)
                            }
                        } catch (err) {
                            console.error(`Error deleting cache for type ${tableName}:`, err);
                        }
                    }
                }
            });
        }
    }
    protected getRowCacheKey(id: string) {
        return `row-data-${id}`;
    }
    private async invalidateRowCacheById(id: string) {
        if (!this.enableCache) return;
        const pattern = this.getRowCacheKey(id);
        await deleteByPattern(pattern);
    }
    createJoinSql(request?: RowModelRequest): string[] {
        return []
    }
    protected async getRowRelation(args: { data: any, staff?: UserProfile }) {
        return args.data;
    }
    protected async setResPermissions(
        data: any,
        staff?: UserProfile,
    ) {
        return data
    }
    protected async getRowDto(
        data: any,
        staff?: UserProfile,
    ): Promise<any> {
        // 如果没有id，直接返回原数据
        if (!data?.id) return data;
        // 如果未启用缓存，直接处理并返回数据
        if (!this.enableCache) {
            return this.processDataWithPermissions(data, staff);
        }
        const key = this.getRowCacheKey(data.id);
        try {
            // 尝试从缓存获取数据
            const cachedData = await this.getCachedData(key, staff);
            // 如果缓存命中，直接返回
            if (cachedData) return cachedData;
            // 处理数据并缓存
            const processedData = await this.processDataWithPermissions(data, staff);
            await redis.set(key, supejson.stringify(processedData));
            return processedData;
        } catch (err) {
            this.logger.error('Error in getRowDto:', err);
            throw err;
        }
    }

    private async getCachedData(
        key: string,
        staff?: UserProfile
    ): Promise<any | null> {
        const cachedDataStr = await redis.get(key);
        if (!cachedDataStr) return null;
        const cachedData = supejson.parse(cachedDataStr) as any;
        if (!cachedData?.id) return null;
        return staff
            ? this.setResPermissions(cachedData, staff)
            : cachedData;
    }

    private async processDataWithPermissions(
        data: any,
        staff?: UserProfile
    ): Promise<any> {
        // 处理权限
        const permData = staff
            ? await this.setResPermissions(data, staff)
            : data;
        // 获取关联数据
        return this.getRowRelation({ data: permData, staff });
    }

    protected createGetRowsFilters(
        request: z.infer<typeof RowRequestSchema>,
        staff?: UserProfile,
    ) {
        const condition = super.createGetRowsFilters(request);
        if (isFieldCondition(condition)) return {};
        const baseCondition: LogicalCondition[] = [
            {
                field: `${this.tableName}.deleted_at`,
                op: 'blank',
                type: 'date',
            },
        ];
        condition.AND = [...baseCondition, ...condition.AND];
        return condition;
    }
    createUnGroupingRowSelect(request?: RowModelRequest): string[] {
        return [
            `${this.tableName}.id AS id`,
            SQLBuilder.rowNumber(`${this.tableName}.id`, `${this.tableName}.id`),
        ];
    }
    protected createGroupingRowSelect(
        request: RowModelRequest,
        wrapperSql: boolean,
    ): string[] {
        const colsToSelect = super.createGroupingRowSelect(request, wrapperSql);
        return colsToSelect.concat([
            SQLBuilder.rowNumber(`${this.tableName}.id`, `${this.tableName}.id`),
        ]);
    }
    protected async getRowsSqlWrapper(
        sql: string,
        request?: RowModelRequest,
        staff?: UserProfile,
    ): Promise<string> {
        const groupingSql = SQLBuilder.join([
            SQLBuilder.select([
                ...this.createGroupingRowSelect(request, true),
                `${this.tableName}.id AS id`,
            ]),
            SQLBuilder.from(this.tableName),
            SQLBuilder.join(this.createJoinSql(request)),
            SQLBuilder.where(this.createGetRowsFilters(request, staff)),
        ]);
        const { rowGroupCols, valueCols, groupKeys } = request;
        if (this.isDoingGroup(request)) {
            const rowGroupCol = rowGroupCols[groupKeys.length];
            const groupByField = rowGroupCol?.field?.replace('.', '_');
            return SQLBuilder.join([
                SQLBuilder.select([
                    groupByField,
                    ...super.createAggSqlForWrapper(request),
                    'COUNT(id) AS child_count',
                ]),
                SQLBuilder.from(`(${groupingSql})`),
                SQLBuilder.where({
                    field: 'row_num',
                    value: '1',
                    op: 'equals',
                }),
                SQLBuilder.groupBy([groupByField]),
                SQLBuilder.orderBy(
                    this.getOrderByColumns(request).map((item) => item.replace('.', '_')),
                ),
                this.getLimitSql(request),
            ]);
        } else
            return SQLBuilder.join([
                SQLBuilder.select(['*']),
                SQLBuilder.from(`(${sql})`),
                SQLBuilder.where({
                    field: 'row_num',
                    value: '1',
                    op: 'equals',
                }),
                this.getLimitSql(request),
            ]);
        // return super.getRowsSqlWrapper(sql, request)
    }
}