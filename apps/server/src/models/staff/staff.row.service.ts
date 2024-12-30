import { Injectable } from '@nestjs/common';
import {
    db,
    ObjectType,
    StaffMethodSchema,
    UserProfile,
    RolePerms,
    ResPerm,
    Staff,
    RowModelRequest,
} from '@nicestack/common';
import { DepartmentService } from '../department/department.service';
import { RowCacheService } from '../base/row-cache.service';
import { z } from 'zod';
import { isFieldCondition } from '../base/sql-builder';
@Injectable()
export class StaffRowService extends RowCacheService {
    constructor(
        private readonly departmentService: DepartmentService,
    ) {
        super(ObjectType.STAFF, false);
    }
    createUnGroupingRowSelect(request?: RowModelRequest): string[] {
        const result = super.createUnGroupingRowSelect(request).concat([
            `${this.tableName}.id AS id`,
            `${this.tableName}.username AS username`,
            `${this.tableName}.showname AS showname`,
            `${this.tableName}.avatar AS avatar`,
            `${this.tableName}.officer_id AS officer_id`,
            `${this.tableName}.phone_number AS phone_number`,
            `${this.tableName}.order AS order`,
            `${this.tableName}.enabled AS enabled`,
            'dept.name AS dept_name',
            'domain.name AS domain_name',
        ]);
        return result
    }
    createJoinSql(request?: RowModelRequest): string[] {
        return [
            `LEFT JOIN department dept ON ${this.tableName}.dept_id = dept.id`,
            `LEFT JOIN department domain ON ${this.tableName}.domain_id = domain.id`,
        ];
    }
    protected createGetRowsFilters(
        request: z.infer<typeof StaffMethodSchema.getRows>,
        staff: UserProfile,
    ) {
        const condition = super.createGetRowsFilters(request);
        const { domainId, includeDeleted = false } = request;
        if (isFieldCondition(condition)) {
            return;
        }
        if (domainId) {
            condition.AND.push({
                field: `${this.tableName}.domain_id`,
                value: domainId,
                op: 'equals',
            });
        } else {
            condition.AND.push({
                field: `${this.tableName}.domain_id`,
                op: 'blank',
            });
        }
        if (!includeDeleted) {
            condition.AND.push({
                field: `${this.tableName}.deleted_at`,
                type: 'date',
                op: 'blank',
            });
        }
        condition.OR = [];
        if (!staff.permissions.includes(RolePerms.MANAGE_ANY_STAFF)) {
            if (staff.permissions.includes(RolePerms.MANAGE_DOM_STAFF)) {
                condition.OR.push({
                    field: 'dept.id',
                    value: staff.domainId,
                    op: 'equals',
                });
            }
        }

        return condition;
    }

    async getPermissionContext(id: string, staff: UserProfile) {
        const data = await db.staff.findUnique({
            where: { id },
            select: {
                deptId: true,
                domainId: true,
            },
        });
        const deptId = data?.deptId;
        const isFromSameDept = staff.deptIds?.includes(deptId);
        const domainChildDeptIds = await this.departmentService.getDescendantIds(
            staff.domainId, true
        );
        const belongsToDomain = domainChildDeptIds.includes(
            deptId,
        );
        return { isFromSameDept, belongsToDomain };
    }
    protected async setResPermissions(
        data: Staff,
        staff: UserProfile,
    ) {
        const permissions: ResPerm = {};
        const { isFromSameDept, belongsToDomain } = await this.getPermissionContext(
            data.id,
            staff,
        );
        const setManagePermissions = (permissions: ResPerm) => {
            Object.assign(permissions, {
                read: true,
                delete: true,
                edit: true,
            });
        };
        staff.permissions.forEach((permission) => {
            switch (permission) {
                case RolePerms.MANAGE_ANY_STAFF:
                    setManagePermissions(permissions);
                    break;
                case RolePerms.MANAGE_DOM_STAFF:
                    if (belongsToDomain) {
                        setManagePermissions(permissions);
                    }
                    break;
            }
        });
        return { ...data, perm: permissions };
    }

}
