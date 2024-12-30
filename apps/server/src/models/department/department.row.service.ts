/**
 * 部门行服务类，继承自 RowCacheService，用于处理部门相关的数据行操作。
 * 该类提供了生成 SQL 查询字段、构建查询过滤器等功能。
 */
import { Injectable } from '@nestjs/common';
import {
  db,
  DepartmentMethodSchema,
  ObjectType,
  UserProfile,
} from '@nicestack/common';
import { date, z } from 'zod';
import { RowCacheService } from '../base/row-cache.service';
import { isFieldCondition } from '../base/sql-builder';

@Injectable()
export class DepartmentRowService extends RowCacheService {
  /**
   * 构造函数，初始化 DepartmentRowService。
   * 调用父类构造函数，传入部门对象类型并禁用缓存。
   */
  constructor() {
    super(ObjectType.DEPARTMENT, false);
  }

  /**
   * 生成未分组行的 SQL 查询字段列表，包括部门特定的字段。
   * @param requset - 请求对象，符合 DepartmentMethodSchema.getRows 的 schema。
   * @returns 返回包含 SQL 查询字段的数组。
   */
  createUnGroupingRowSelect(
    requset: z.infer<typeof DepartmentMethodSchema.getRows>,
  ): string[] {
    // 调用父类方法生成基础查询字段，并拼接部门特定的字段
    const result = super.createUnGroupingRowSelect(requset).concat([
      `${this.tableName}.name AS name`, // 部门名称
      `${this.tableName}.is_domain AS is_domain`, // 是否为域
      `${this.tableName}.order AS order`, // 排序
      `${this.tableName}.has_children AS has_children`, // 是否有子部门
      `${this.tableName}.parent_id AS parent_id` // 父部门 ID
    ]);
    return result;
  }

  /**
   * 根据请求和用户信息构建 getRows 查询的过滤器。
   * @param request - 请求对象，符合 DepartmentMethodSchema.getRows 的 schema。
   * @param staff - 发起请求的用户信息。
   * @returns 返回用于过滤行的条件对象。
   */
  protected createGetRowsFilters(
    request: z.infer<typeof DepartmentMethodSchema.getRows>,
    staff: UserProfile,
  ) {
    // 调用父类方法生成基础过滤条件
    const condition = super.createGetRowsFilters(request);
    const { parentId, includeDeleted = false } = request;

    // 如果条件已经是字段条件，则跳过后续处理
    if (isFieldCondition(condition)) {
      return;
    }

    // 如果请求中没有分组键，则添加父部门 ID 过滤条件
    if (request.groupKeys.length === 0) {
      if (parentId) {
        condition.AND.push({
          field: `${this.tableName}.parent_id`,
          value: parentId,
          op: 'equals', // 等于操作符
        });
      } else if (parentId === null) {
        condition.AND.push({
          field: `${this.tableName}.parent_id`,
          op: "blank", // 空白操作符
        });
      }
    }

    // 如果 includeDeleted 为 false，则排除已删除的行
    if (!includeDeleted) {
      condition.AND.push({
        field: `${this.tableName}.deleted_at`,
        type: 'date',
        op: 'blank', // 空白操作符
      });
    }

    return condition;
  }
}
