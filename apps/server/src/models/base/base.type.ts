import { db, Prisma, PrismaClient } from "@nicestack/common";

export type Operations =
    | 'aggregate'
    | 'count'
    | 'create'
    | 'createMany'
    | 'delete'
    | 'deleteMany'
    | 'findFirst'
    | 'findMany'
    | 'findUnique'
    | 'update'
    | 'updateMany'
    | 'upsert';
export type DelegateFuncs = { [K in Operations]: (args: any) => Promise<unknown> }
export type DelegateArgs<T> = {
    [K in keyof T]: T[K] extends (args: infer A) => Promise<any> ? A : never;
};

export type DelegateReturnTypes<T> = {
    [K in keyof T]: T[K] extends (args: any) => Promise<infer R> ? R : never;
};

export type WhereArgs<T> = T extends { where: infer W } ? W : never;
export type SelectArgs<T> = T extends { select: infer S } ? S : never;
export type DataArgs<T> = T extends { data: infer D } ? D : never;
export type IncludeArgs<T> = T extends { include: infer I } ? I : never;
export type OrderByArgs<T> = T extends { orderBy: infer O } ? O : never;
export type UpdateOrderArgs = {
    id: string
    overId: string
}
export interface FindManyWithCursorType<T extends DelegateFuncs> {
    cursor?: string;
    limit?: number;
    where?: WhereArgs<DelegateArgs<T>['findUnique']>;
    select?: SelectArgs<DelegateArgs<T>['findUnique']>;
    orderBy?: OrderByArgs<DelegateArgs<T>['findMany']>
}
export type TransactionType = Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;