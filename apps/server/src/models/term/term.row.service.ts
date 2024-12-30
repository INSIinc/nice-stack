import { Injectable } from '@nestjs/common';
import {
  ObjectType,
  RowModelRequest,
  TermMethodSchema,
  UserProfile,
} from '@nicestack/common';
import { date, z } from 'zod';
import { RowCacheService } from '../base/row-cache.service';
import { isFieldCondition } from '../base/sql-builder';

@Injectable()
export class TermRowService extends RowCacheService {
  constructor() {
    super(ObjectType.TERM, false);
  }
  createUnGroupingRowSelect(
    requset: z.infer<typeof TermMethodSchema.getRows>,
  ): string[] {
    const result = super.createUnGroupingRowSelect(requset).concat([
      `${this.tableName}.name AS name`,
      `${this.tableName}.order AS order`,
      `${this.tableName}.has_children AS has_children`,
      `${this.tableName}.parent_id AS parent_id`,
      `${this.tableName}.domain_id AS domain_id`,
      `taxonomy.name AS taxonomy_name`,
      `taxonomy.id AS taxonomy_id`
    ]);
    return result;
  }
  createJoinSql(request?: RowModelRequest): string[] {
    return [
      `LEFT JOIN taxonomy ON ${this.tableName}.taxonomy_id = taxonomy.id`
    ];
  }
  protected createGetRowsFilters(
    request: z.infer<typeof TermMethodSchema.getRows>,
    staff: UserProfile,
  ) {
    const condition = super.createGetRowsFilters(request);
    const { parentId, domainId, includeDeleted = false, taxonomyId } = request;
    if (isFieldCondition(condition)) {
      return;
    }

    if (request.groupKeys.length === 0) {
      if (parentId) {
        condition.AND.push({
          field: `${this.tableName}.parent_id`,
          value: parentId,
          op: 'equals',
        });
      } else if (parentId === null) {
        condition.AND.push({
          field: `${this.tableName}.parent_id`,
          op: "blank",
        });
      }
    }
    if (domainId) {
      condition.AND.push({
        field: `${this.tableName}.domain_id`,
        value: domainId,
        op: 'equals',
      });
    } else if (domainId === null) {
      condition.AND.push({
        field: `${this.tableName}.domain_id`,
        op: "blank",
      });
    }
    if (taxonomyId) {
      condition.AND.push({
        field: `${this.tableName}.taxonomy_id`,
        value: taxonomyId,
        op: 'equals',
      });
    }
    if (!includeDeleted) {
      condition.AND.push({
        field: `${this.tableName}.deleted_at`,
        type: 'date',
        op: 'blank',
      });
    }


    return condition;
  }

}
