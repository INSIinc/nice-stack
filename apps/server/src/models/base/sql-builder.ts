export interface FieldCondition {
    field: string;
    op: OperatorType
    type?: "text" | "number" | "date";
    value?: any;
    valueTo?: any;
};
export type OperatorType = 'equals' | 'notEqual' | 'contains' | 'startsWith' | 'endsWith' | 'blank' | 'notBlank' | 'greaterThan' | 'lessThanOrEqual' | 'inRange' | 'lessThan' | 'greaterThan' | 'in';
export type LogicalCondition = FieldCondition | {
    AND?: LogicalCondition[];
    OR?: LogicalCondition[];
};

export function isFieldCondition(condition: LogicalCondition): condition is FieldCondition {
    return (condition as FieldCondition).field !== undefined;
}
function buildCondition(condition: FieldCondition): string {
    const { field, op, value, type = "text", valueTo } = condition;
    switch (op) {
        case 'equals':
            return `${field} = '${value}'`;
        case 'notEqual':
            return `${field} != '${value}'`;
        case 'contains':
            return `${field} LIKE '%${value}%'`;
        case 'startsWith':
            return `${field} LIKE '${value}%'`;
        case 'endsWith':
            return `${field} LIKE '%${value}'`;
        case 'blank':
            if (type !== "date")
                return `(${field} IS NULL OR ${field} = '')`;
            else
                return `${field} IS NULL`;
        case 'notBlank':
            if (type !== 'date')
                return `${field} IS NOT NULL AND ${field} != ''`;
            else
                return `${field} IS NOT NULL`;
        case 'greaterThan':
            return `${field} > '${value}'`;
        case 'lessThanOrEqual':
            return `${field} <= '${value}'`;
        case 'lessThan':
            return `${field} < '${value}'`;
        case 'greaterThan':
            return `${field} > '${value}'`;
        case 'inRange':
            return `${field} >= '${value}' AND ${field} <= '${valueTo}'`;
        case 'in':
            if (!value || (Array.isArray(value) && value.length === 0)) {
                // Return a condition that is always false if value is empty or an empty array
                return '1 = 0';
            }
            return `${field} IN (${(value as any[]).map(val => `'${val}'`).join(', ')})`;
        default:
            return 'true'; // Default return for unmatched conditions
    }
}
function buildLogicalCondition(logicalCondition: LogicalCondition): string {
    if (isFieldCondition(logicalCondition)) {
        return buildCondition(logicalCondition);
    }
    const parts: string[] = [];
    if (logicalCondition.AND && logicalCondition.AND.length > 0) {
        const andParts = logicalCondition.AND
            .map(c => buildLogicalCondition(c))
            .filter(part => part !== ''); // Filter out empty conditions
        if (andParts.length > 0) {
            parts.push(`(${andParts.join(' AND ')})`);
        }
    }
    // Process OR conditions
    if (logicalCondition.OR && logicalCondition.OR.length > 0) {
        const orParts = logicalCondition.OR
            .map(c => buildLogicalCondition(c))
            .filter(part => part !== ''); // Filter out empty conditions
        if (orParts.length > 0) {
            parts.push(`(${orParts.join(' OR ')})`);
        }
    }
    // Join AND and OR parts with an 'AND' if both are present
    return parts.length > 1 ? parts.join(' AND ') : parts[0] || '';
}

export class SQLBuilder {
    static select(fields: string[], distinctField?: string): string {
        const distinctClause = distinctField ? `DISTINCT ON (${distinctField}) ` : "";
        return `SELECT ${distinctClause}${fields.join(", ")}`;
    }
    static rowNumber(orderBy: string, partitionBy: string | null = null, alias: string = 'row_num'): string {
        if (!orderBy) {
            throw new Error("orderBy 参数不能为空");
        }

        let partitionClause = '';
        if (partitionBy) {
            partitionClause = `PARTITION BY ${partitionBy} `;
        }

        return `ROW_NUMBER() OVER (${partitionClause}ORDER BY ${orderBy}) AS ${alias}`;
    }
    static from(tableName: string): string {
        return `FROM ${tableName}`;
    }

    static where(conditions: LogicalCondition): string {
        const whereClause = buildLogicalCondition(conditions);
        return whereClause ? `WHERE ${whereClause}` : "";
    }

    static groupBy(columns: string[]): string {
        return columns.length ? `GROUP BY ${columns.join(", ")}` : "";
    }

    static orderBy(columns: string[]): string {
        return columns.length ? `ORDER BY ${columns.join(", ")}` : "";
    }

    static limit(pageSize: number, offset: number = 0): string {
        return `LIMIT ${pageSize + 1} OFFSET ${offset}`;
    }

    static join(clauses: string[]): string {
        return clauses.filter(Boolean).join(' ');
    }
    static createFilterSql(key: string, item: any): LogicalCondition {
        const conditionFuncs: Record<string, (item: { values?: any[], dateFrom?: string, dateTo?: string, filter: any, type: OperatorType, filterType: OperatorType }) => LogicalCondition> = {
            text: (item) => ({ value: item.filter, op: item.type, field: key }),
            number: (item) => ({ value: item.filter, op: item.type, field: key }),
            date: (item) => ({ value: item.dateFrom, valueTo: item.dateTo, op: item.type, field: key }),
            set: (item) => ({ value: item.values, op: "in", field: key })
        }
        return conditionFuncs[item.filterType](item)

    }
}

