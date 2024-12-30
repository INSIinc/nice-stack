import { Logger } from "@nestjs/common";
import { UserProfile, db, getUniqueItems, ObjectWithId, Prisma, RowModelRequest } from "@nicestack/common";
import { LogicalCondition, OperatorType, SQLBuilder } from './sql-builder';
export interface GetRowOptions {
    id?: string;
    ids?: string[];
    extraCondition?: LogicalCondition;
    staff?: UserProfile;
}
export abstract class RowModelService {
    private keywords: Set<string> = new Set([
        'SELECT', 'FROM', 'WHERE', 'ORDER', 'BY', 'GROUP', 'JOIN', 'AND', 'OR'
        // 添加更多需要引号的关键词
    ]);
    protected logger = new Logger(this.tableName);
    protected constructor(protected tableName: string) { }
    protected async getRowDto(row: ObjectWithId, staff?: UserProfile): Promise<any> {
        return row;
    }
    protected async getRowsSqlWrapper(sql: string, request?: RowModelRequest, staff?: UserProfile) {
        return SQLBuilder.join([sql, this.getLimitSql(request)])
    }
    protected getLimitSql(request: RowModelRequest) {
        return SQLBuilder.limit(request.endRow - request.startRow, request.startRow)
    }
    abstract createJoinSql(request?: RowModelRequest): string[];
    async getRows(request: RowModelRequest, staff?: UserProfile): Promise<{ rowCount: number, rowData: any[] }> {
        try {
            // this.logger.debug('request', request)
            let SQL = SQLBuilder.join([
                SQLBuilder.select(this.getRowSelectCols(request)),
                SQLBuilder.from(this.tableName),
                SQLBuilder.join(this.createJoinSql(request)),
                SQLBuilder.where(this.createGetRowsFilters(request, staff)),
                SQLBuilder.groupBy(this.getGroupByColumns(request)),
                SQLBuilder.orderBy(this.getOrderByColumns(request)),
            ]);
            SQL = await this.getRowsSqlWrapper(SQL, request, staff)

            this.logger.debug('getrows', SQL)

            const results: any[] = await db.$queryRawUnsafe(SQL) || [];

            let rowDataDto = await Promise.all(results.map(row => this.getRowDto(row, staff)))

            // if (this.getGroupByColumns(request).length === 0)
            //     rowDataDto = getUniqueItems(rowDataDto, "id")
            // this.logger.debug('result', results.length, this.getRowCount(request, rowDataDto))
            return { rowCount: this.getRowCount(request, rowDataDto) || 0, rowData: rowDataDto };
        } catch (error: any) {
            this.logger.error('Error executing getRows:', error);
            // throw new Error(`Failed to get rows: ${error.message}`);
        }
    }
    getRowCount(request: RowModelRequest, results: any[]) {
        if (results === null || results === undefined || results.length === 0) {
            return null;
        }
        const currentLastRow = request.startRow + results.length;
        return currentLastRow <= request.endRow ? currentLastRow : -1;
    }

    async getRowById(options: GetRowOptions): Promise<any> {
        const { id, extraCondition = {
            field: `${this.tableName}.deleted_at`,
            op: "blank",
            type: "date"
        }, staff } = options;
        return this.getSingleRow({ AND: [this.createGetByIdFilter(id!), extraCondition] }, staff);
    }

    async getRowByIds(options: GetRowOptions): Promise<any[]> {
        const { ids, extraCondition = {
            field: `${this.tableName}.deleted_at`,
            op: "blank",
            type: "date"
        }, staff } = options;
        return this.getMultipleRows({ AND: [this.createGetByIdsFilter(ids!), extraCondition] }, staff);
    }

    protected createGetRowsFilters(request: RowModelRequest, staff?: UserProfile): LogicalCondition {
        let groupConditions = []
        if (this.isDoingTreeGroup(request)) {
            groupConditions = [
                {
                    field: 'parent_id',
                    op: "equals" as OperatorType,
                    value: request.groupKeys[request.groupKeys.length - 1]
                }
            ]
        } else {
            groupConditions = request.groupKeys.map((key, index) => ({
                field: request.rowGroupCols[index].field,
                op: "equals" as OperatorType,
                value: key
            }))
        }

        const condition: LogicalCondition = {
            AND: [...groupConditions, ...this.buildFilterConditions(request.filterModel)]
        }

        return condition;
    }
    private buildFilterConditions(filterModel: any): LogicalCondition[] {
        return filterModel
            ? Object.entries(filterModel)?.map(([key, item]) => SQLBuilder.createFilterSql(key === 'ag-Grid-AutoColumn' ? 'name' : key, item))
            : [];
    }

    getRowSelectCols(request: RowModelRequest): string[] {
        return this.isDoingGroup(request)
            ? this.createGroupingRowSelect(request)
            : this.createUnGroupingRowSelect(request);
    }
    protected createUnGroupingRowSelect(request?: RowModelRequest): string[] {
        return ['*'];
    }
    protected createAggSqlForWrapper(request: RowModelRequest) {
        const { rowGroupCols, valueCols, groupKeys } = request;
        return valueCols.map(valueCol =>
            `${valueCol.aggFunc}(${valueCol.field.replace('.', '_')}) AS ${valueCol.field.split('.').join('_')}`
        );
    }
    protected createGroupingRowSelect(request: RowModelRequest, wrapperSql: boolean = false): string[] {
        const { rowGroupCols, valueCols, groupKeys } = request;
        const colsToSelect = [];

        const rowGroupCol = rowGroupCols[groupKeys.length];
        if (rowGroupCol) {
            colsToSelect.push(`${rowGroupCol.field} AS ${rowGroupCol.field.replace('.', '_')}`);
        }
        colsToSelect.push(...valueCols.map(valueCol =>
            `${wrapperSql ? "" : valueCol.aggFunc}(${valueCol.field}) AS ${valueCol.field.replace('.', '_')}`
        ));

        return colsToSelect;
    }

    getGroupByColumns(request: RowModelRequest): string[] {
        return this.isDoingGroup(request)
            ? [request.rowGroupCols[request.groupKeys.length]?.field]
            : [];
    }


    getOrderByColumns(request: RowModelRequest): string[] {
        const { sortModel, rowGroupCols, groupKeys } = request;
        const grouping = this.isDoingGroup(request);
        const sortParts: string[] = [];

        if (sortModel) {
            const groupColIds = rowGroupCols.map(groupCol => groupCol.id).slice(0, groupKeys.length + 1);
            sortModel.forEach(item => {
                if (!grouping || (groupColIds.indexOf(item.colId) >= 0 && rowGroupCols[groupKeys.length].field === item.colId)) {
                    const colId = this.keywords.has(item.colId.toUpperCase()) ? `"${item.colId}"` : item.colId;
                    sortParts.push(`${colId} ${item.sort}`);
                }
            });
        }

        return sortParts;
    }
    isDoingGroup(requset: RowModelRequest): boolean {
        return requset.rowGroupCols.length > requset.groupKeys.length;
    }
    isDoingTreeGroup(requset: RowModelRequest): boolean {
        return requset.rowGroupCols.length === 0 && requset.groupKeys.length > 0;
    }
    private async getSingleRow(condition: LogicalCondition, staff?: UserProfile): Promise<any> {
        const results = await this.getRowsWithFilters(condition, staff)
        return results[0]
    }
    private async getMultipleRows(condition: LogicalCondition, staff?: UserProfile): Promise<any[]> {
        return this.getRowsWithFilters(condition, staff);
    }

    private async getRowsWithFilters(condition: LogicalCondition, staff?: UserProfile): Promise<any[]> {
        try {
            let SQL = SQLBuilder.join([
                SQLBuilder.select(this.createUnGroupingRowSelect()),
                SQLBuilder.from(this.tableName),
                SQLBuilder.join(this.createJoinSql()),
                SQLBuilder.where(condition)
            ]);

            // this.logger.debug(SQL)
            const results: any[] = await db.$queryRawUnsafe(SQL);

            let rowDataDto = await Promise.all(results.map(item => this.getRowDto(item, staff)));

            // rowDataDto = getUniqueItems(rowDataDto, "id")
            return rowDataDto
        } catch (error) {
            this.logger.error('Error executing query:', error);
            throw error;
        }
    }

    async getAggValues(request: RowModelRequest) {
        try {
            const SQL = SQLBuilder.join([
                SQLBuilder.select(this.buildAggSelect(request.valueCols)),
                SQLBuilder.from(this.tableName),
                SQLBuilder.join(this.createJoinSql(request)),
                SQLBuilder.where(this.createGetRowsFilters(request)),
                SQLBuilder.groupBy(this.buildAggGroupBy())
            ]);
            const result = await db.$queryRawUnsafe(SQL);
            return result[0];
        } catch (error) {
            this.logger.error('Error executing query:', error);
            throw error;
        }
    }
    protected buildAggGroupBy(): string[] {
        return [];
    }
    protected buildAggSelect(valueCols: any[]): string[] {
        return valueCols.map(valueCol =>
            `${valueCol.aggFunc}(${valueCol.field}) AS ${valueCol.field.replace('.', '_')}`
        );
    }

    private createGetByIdFilter(id: string): LogicalCondition {
        return {
            field: `${this.tableName}.id`,
            value: id,
            op: "equals"
        }
    }
    private createGetByIdsFilter(ids: string[]): LogicalCondition {
        return {
            field: `${this.tableName}.id`,
            value: ids,
            op: "in"
        };
    }
}

