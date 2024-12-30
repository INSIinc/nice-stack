import { db, Prisma, PrismaClient } from '@nicestack/common';
import {
  Operations,
  DelegateArgs,
  DelegateReturnTypes,
  DataArgs,
  WhereArgs,
  DelegateFuncs,
  UpdateOrderArgs,
  TransactionType,
} from './base.type';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ERROR_MAP, operationT, PrismaErrorCode } from './errorMap.prisma';

/**
 * BaseService provides a generic CRUD interface for a prisma model.
 * It enables common data operations such as find, create, update, and delete.
 *
 * @template D - Type for the model delegate, defining available operations.
 * @template A - Arguments for the model delegate's operations.
 * @template R - Return types for the model delegate's operations.
 */
export class BaseService<
  D extends DelegateFuncs,
  A extends DelegateArgs<D> = DelegateArgs<D>,
  R extends DelegateReturnTypes<D> = DelegateReturnTypes<D>,
> {
  protected ORDER_INTERVAL = 100;
  /**
   * Initializes the BaseService with the specified model.
   * @param model - The Prisma model delegate for database operations.
   */
  constructor(
    protected prisma: PrismaClient,
    protected objectType: string,
    protected enableOrder: boolean = false
  ) {

  }

  /**
   * Retrieves the name of the model dynamically.
   * @returns {string} - The name of the model.
   */
  private getModelName(): string {
    const modelName = this.getModel().constructor.name;
    return modelName;
  }
  private getModel(tx?: TransactionType): D {
    return tx?.[this.objectType] || this.prisma[this.objectType] as D;
  }
  /**
   * Error handling helper function
   */
  private handleError(error: any, operation: operationT): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const handler = ERROR_MAP[error.code as PrismaErrorCode];
      if (handler) {
        throw handler(
          operation,
          error?.meta || {
            target: 'record',
            model: this.getModelName(),
          },
        );
      }
      throw new InternalServerErrorException(
        `Database error: ${error.message}`,
      );
    }
    throw new InternalServerErrorException(
      `Unexpected error: ${error.message || 'Unknown error occurred.'}`,
    );
  }
  /**
   * Finds a unique record by given criteria.
   * @param args - Arguments to find a unique record.
   * @returns {Promise<R['findUnique']>} - A promise resolving to the found record.
   * @example
   * const user = await service.findUnique({ where: { id: 'user_id' } });
   */
  async findUnique(args: A['findUnique']): Promise<R['findUnique']> {
    try {
      return this.getModel().findUnique(args as any) as Promise<R['findUnique']>;
    } catch (error) {
      this.handleError(error, 'read');
    }
  }
  /**
   * Finds the first record matching the given criteria.
   * @param args - Arguments to find the first matching record.
   * @returns {Promise<R['findFirst']>} - A promise resolving to the first matching record.
   * @example
   * const firstUser = await service.findFirst({ where: { name: 'John' } });
   */
  async findFirst(args: A['findFirst']): Promise<R['findFirst']> {
    try {
      return this.getModel().findFirst(args as any) as Promise<R['findFirst']>;
    } catch (error) {
      this.handleError(error, 'read');
    }
  }

  /**
   * Finds a record by its ID.
   * @param id - The ID of the record to find.
   * @param args - Optional additional arguments for the find operation.
   * @returns {Promise<R['findFirst']>} - A promise resolving to the found record.
   * @throws {NotFoundException} - If no record is found with the given ID.
   * @example
   * const user = await service.findById('user_id');
   */
  async findById(id: string, args?: A['findFirst']): Promise<R['findFirst']> {
    try {
      const record = (await this.getModel().findFirst({
        where: { id },
        ...(args || {}),
      })) as R['findFirst'];
      if (!record) {
        throw new NotFoundException(`Record with ID ${id} not found.`);
      }
      return record;
    } catch (error) {
      this.handleError(error, 'read');
    }
  }

  /**
   * Finds multiple records matching the given criteria.
   * @param args - Arguments to find multiple records.
   * @returns {Promise<R['findMany']>} - A promise resolving to the list of found records.
   * @example
   * const users = await service.findMany({ where: { isActive: true } });
   */
  async findMany(args: A['findMany']): Promise<R['findMany']> {
    try {
      return this.getModel().findMany(args as any) as Promise<R['findMany']>;
    } catch (error) {
      this.handleError(error, 'read');
    }
  }

  /**
   * Creates a new record with the given data.
   * @param args - Arguments to create a record.
   * @returns {Promise<R['create']>} - A promise resolving to the created record.
   * @example
   * const newUser = await service.create({ data: { name: 'John Doe' } });
   */
  async create(args: A['create'], params?: any): Promise<R['create']> {

    try {
   
      if (this.enableOrder && !(args as any).data.order) {
        // 查找当前最大的 order 值
        const maxOrderItem = await this.getModel(params?.tx).findFirst({
          orderBy: { order: 'desc' }
        }) as any;
        // 设置新记录的 order 值
        const newOrder = maxOrderItem ? maxOrderItem.order + this.ORDER_INTERVAL : 1;
        // 将 order 添加到创建参数中
        (args as any).data.order = newOrder;
      }
      return this.getModel(params?.tx).create(args as any) as Promise<R['create']>;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }


  /**
   * Creates multiple new records with the given data.
   * @param args - Arguments to create multiple records.
   * @returns {Promise<R['createMany']>} - A promise resolving to the created records.
   * @example
   * const newUsers = await service.createMany({ data: [{ name: 'John' }, { name: 'Jane' }] });
   */
  async createMany(args: A['createMany'], params?: any): Promise<R['createMany']> {
    try {
      return this.getModel(params?.tx).createMany(args as any) as Promise<R['createMany']>;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Updates a record with the given data.
   * @param args - Arguments to update a record.
   * @returns {Promise<R['update']>} - A promise resolving to the updated record.
   * @example
   * const updatedUser = await service.update({ where: { id: 'user_id' }, data: { name: 'John' } });
   */
  async update(args: A['update'], params?: any): Promise<R['update']> {
    try {

      return this.getModel(params?.tx).update(args as any) as Promise<R['update']>;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Updates a record by ID with the given data.
   * @param id - The ID of the record to update.
   * @param data - The data to update the record with.
   * @returns {Promise<R['update']>} - A promise resolving to the updated record.
   * @example
   * const updatedUser = await service.updateById('user_id', { name: 'John Doe' });
   */
  async updateById(
    id: string,
    data: DataArgs<A['update']>,
  ): Promise<R['update']> {
    try {
      return (await this.getModel().update({
        where: { id },
        data: data as any,
      })) as R['update'];
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Deletes a record by ID.
   * @param id - The ID of the record to delete.
   * @returns {Promise<R['delete']>} - A promise resolving to the deleted record.
   * @example
   * const deletedUser = await service.deleteById('user_id');
   */
  async deleteById(id: string): Promise<R['delete']> {
    try {
      return (await this.getModel().delete({
        where: { id },
      })) as R['delete'];
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }

  /**
   * Deletes a record based on the given criteria.
   * @param args - Arguments to delete a record.
   * @returns {Promise<R['delete']>} - A promise resolving to the deleted record.
   * @example
   * const deletedUser = await service.delete({ where: { name: 'John' } });
   */
  async delete(args: A['delete'], params?: any): Promise<R['delete']> {
    try {
      return this.getModel(params?.tx).delete(args as any) as Promise<R['delete']>;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }

  /**
   * Creates or updates a record based on the given criteria.
   * @param args - Arguments to upsert a record.
   * @returns {Promise<R['upsert']>} - A promise resolving to the created or updated record.
   * @example
   * const user = await service.upsert({ where: { id: 'user_id' }, create: { name: 'John' }, update: { name: 'Johnny' } });
   */
  async upsert(args: A['upsert']): Promise<R['upsert']> {
    try {
      return this.getModel().upsert(args as any) as Promise<R['upsert']>;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Counts the number of records matching the given criteria.
   * @param args - Arguments to count records.
   * @returns {Promise<R['count']>} - A promise resolving to the count.
   * @example
   * const userCount = await service.count({ where: { isActive: true } });
   */
  async count(args: A['count']): Promise<R['count']> {
    try {
      return this.getModel().count(args as any) as Promise<R['count']>;
    } catch (error) {
      this.handleError(error, 'read');
    }
  }

  /**
   * Aggregates records based on the given criteria.
   * @param args - Arguments to aggregate records.
   * @returns {Promise<R['aggregate']>} - A promise resolving to the aggregation result.
   * @example
   * const userAggregates = await service.aggregate({ _count: true });
   */
  async aggregate(args: A['aggregate']): Promise<R['aggregate']> {
    try {
      return this.getModel().aggregate(args as any) as Promise<R['aggregate']>;
    } catch (error) {
      this.handleError(error, 'read');
    }
  }

  /**
   * Deletes multiple records based on the given criteria.
   * @param args - Arguments to delete multiple records.
   * @returns {Promise<R['deleteMany']>} - A promise resolving to the result of the deletion.
   * @example
   * const deleteResult = await service.deleteMany({ where: { isActive: false } });
   */
  async deleteMany(args: A['deleteMany'], params?: any): Promise<R['deleteMany']> {
    try {

      return this.getModel(params?.tx).deleteMany(args as any) as Promise<R['deleteMany']>;
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }

  /**
   * Updates multiple records based on the given criteria.
   * @param args - Arguments to update multiple records.
   * @returns {Promise<R['updateMany']>} - A promise resolving to the result of the update.
   * @example
   * const updateResult = await service.updateMany({ where: { isActive: true }, data: { isActive: false } });
   */
  async updateMany(args: A['updateMany']): Promise<R['updateMany']> {
    try {
      return this.getModel().updateMany(args as any) as Promise<R['updateMany']>;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Finds a record by unique criteria or creates it if not found.
   * @param args - Arguments to find or create a record.
   * @returns {Promise<R['findUnique'] | R['create']>} - A promise resolving to the found or created record.
   * @example
   * const user = await service.findOrCreate({ where: { email: 'john@example.com' }, create: { email: 'john@example.com', name: 'John' } });
   */
  async findOrCreate(args: {
    where: WhereArgs<A['findUnique']>;
    create: DataArgs<A['create']>;
  }): Promise<R['findUnique'] | R['create']> {
    try {
      const existing = (await this.getModel().findUnique({
        where: args.where,
      } as any)) as R['findUnique'];
      if (existing) {
        return existing;
      }
      return this.getModel().create({ data: args.create } as any) as Promise<
        R['create']
      >;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Checks if a record exists based on the given criteria.
   * @param where - The criteria to check for existence.
   * @returns {Promise<boolean>} - A promise resolving to true if the record exists, false otherwise.
   * @example
   * const exists = await service.exists({ email: 'john@example.com' });
   */
  async exists(where: WhereArgs<A['findUnique']>): Promise<boolean> {
    try {
      const count = (await this.getModel().count({ where } as any)) as number;
      return count > 0;
    } catch (error) {
      this.handleError(error, 'read');
    }
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
    try {
      if (!ids || ids.length === 0) {
        return []; // Return empty array if no IDs are provided
      }
      return this.getModel().updateMany({
        where: { id: { in: ids } },
        data: { ...data, deletedAt: new Date() } as any,
      }) as Promise<R['update'][]>;
    } catch (error) {
      this.handleError(error, 'delete');
      throw error; // Re-throw the error to be handled higher up
    }
  }
  /**
   * Restores soft-deleted records by setting `isDeleted` to false for the given IDs.
   * @param ids - An array of IDs of the records to restore.
   * @param data - Additional data to update on restore. (Optional)
   * @returns {Promise<R['update'][]>} - A promise resolving to an array of updated records.
   * @example
   * const restoredUsers = await service.restoreByIds(['user_id1', 'user_id2'], { restoredBy: 'admin' });
   */
  async restoreByIds(
    ids: string[],
    data: Partial<DataArgs<A['update']>> = {}, // Default to empty object
  ): Promise<R['update'][]> {
    try {
      if (!ids || ids.length === 0) {
        return []; // Return empty array if no IDs are provided
      }
      return this.getModel().updateMany({
        where: { id: { in: ids }, isDeleted: true }, // Only restore soft-deleted records
        data: { ...data, deletedAt: null } as any,
      }) as Promise<R['update'][]>;
    } catch (error) {
      this.handleError(error, "update");

    }
  }

  /**
   * Finds multiple records with pagination.
   * @param args - Arguments including page, pageSize, and optional filters.
   * @returns {Promise<R['findMany']>} - A promise resolving to the paginated list of records.
   * @example
   * const users = await service.findManyWithPagination({ page: 1, pageSize: 10, where: { isActive: true } });
   */
  async findManyWithPagination(args: {
    page: number;
    pageSize: number;
    where?: WhereArgs<A['findUnique']>;
  }): Promise<R['findMany']> {
    const { page, pageSize, where } = args;
    try {
      return this.getModel().findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
      } as any) as Promise<R['findMany']>;
    } catch (error) {
      this.handleError(error, 'read');
    }
  }
  /**
   * 基于游标的分页查询方法
   * @description 该方法实现了基于游标的分页查询,相比传统的offset/limit分页有更好的性能
   * @param args 查询参数对象,包含cursor、take、where、orderBy、select等字段
   * @returns 返回查询结果对象,包含items数组、总数和下一页游标
   */
  async findManyWithCursor(
    args: A['findMany'],
  ): Promise<{ items: R['findMany']; nextCursor: string }> {
    // 解构查询参数,设置默认每页取10条记录
    const { cursor, take = 6, where, orderBy, select } = args as any;

    try {

      /**
       * 执行查询
       * @description 查询条件包含:
       * 1. where - 过滤条件
       * 2. orderBy - 排序规则,除了传入的排序外,还加入updatedAt和id的降序作为稳定排序
       * 3. select - 选择返回的字段
       * 4. take - 实际取n+1条记录,用于判断是否还有下一页
       * 5. cursor - 游标定位,基于updatedAt和id的组合
       */
      const items = (await this.getModel().findMany({
        where: where,
        orderBy: [{ ...orderBy }, { updatedAt: 'desc' }, { id: 'desc' }],
        select,
        take: take + 1,
        cursor: cursor
          ? { updatedAt: cursor.split('_')[0], id: cursor.split('_')[1] }
          : undefined,
      } as any)) as any[];


      /**
       * 处理下一页游标
       * @description 
       * 1. 如果查到的记录数超过take,说明还有下一页
       * 2. 将最后一条记录弹出,用其updatedAt和id构造下一页游标
       * 3. 游标格式为: updatedAt_id
       */
      let nextCursor: string | null = '';
      if (items.length > take) {
        const nextItem = items.pop();
        nextCursor = `${nextItem!.updatedAt?.toISOString()}_${nextItem!.id}`;
      }
      if (nextCursor === '') {
        nextCursor = null;
      }

      /**
       * 返回查询结果
       * @returns {Object} 
       * - items: 当前页记录
       * - totalCount: 总记录数
       * - nextCursor: 下一页游标
       */
      return {
        items: items as R['findMany'],
        nextCursor: nextCursor,
      };
    } catch (error) {
      this.handleError(error, 'read');
    }
  }

  async updateOrder(args: UpdateOrderArgs) {
    const { id, overId } = args;
    const [currentObject, targetObject] = (await Promise.all([
      this.findFirst({ where: { id } } as any),
      this.findFirst({ where: { id: overId } } as any),
    ])) as any;
    if (!currentObject || !targetObject) {
      throw new Error('Invalid object or target object');
    }
    const nextObject = (await this.findFirst({
      where: {
        order: { gt: targetObject.order },
        deletedAt: null,
      },
      orderBy: { order: 'asc' }
    } as any)) as any;

    const newOrder = nextObject
      ? (targetObject.order + nextObject.order) / 2
      : targetObject.order + this.ORDER_INTERVAL;
    return this.update({ where: { id }, data: { order: newOrder } } as any);
  }
  /**
   * Wraps the result of a database operation with a transformation function.
   * @template T - The type of the result to be transformed.
   * @param operationPromise - The promise representing the database operation.
   * @param transformFn - A function that transforms the result.
   * @returns {Promise<T>} - A promise resolving to the transformed result.
   * @example
   * const user = await service.wrapResult(
   *   service.findUnique({ where: { id: 'user_id' } }),
   *   (result) => ({ ...result, fullName: `${result.firstName} ${result.lastName}` })
   * );
   */
  async wrapResult<T>(
    operationPromise: Promise<T>,
    transformFn: (result: T) => Promise<T>,
  ): Promise<T> {
    try {
      const result = await operationPromise;
      return await transformFn(result);
    } catch (error) {
      throw error; // Re-throw the error to maintain existing error handling
    }
  }
}
