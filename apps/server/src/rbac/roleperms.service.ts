import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  ObjectType,
  RolePerms,
  RelationType,
  db,
  Staff,
  Term,
  GenPerms,
} from '@nicestack/common';
import { DepartmentService } from '@server/models/department/department.service';
import { RelationService } from '@server/relation/relation.service';
import { RoleMapService } from './rolemap.service';
type RolePermsHandlers = {
  [key in RolePerms]?: (permissions: GenPerms) => void;
};

@Injectable()
export class RolePermsService {
  constructor(
    private readonly relations: RelationService,
    private readonly departments: DepartmentService,
    private readonly rbac: RoleMapService,
  ) { }
  private readonly logger = new Logger(RolePermsService.name);
  async getStaffPerms(staff: Staff) {
    const staffPerms = await this.rbac.getPermsForObject({
      domainId: staff.domainId,
      staffId: staff.id,
      deptId: staff.deptId,
    });
    return staffPerms;
  }
  async getTermPerms(staff: Staff, term: Term) {
    const termPerms: GenPerms = {
      delete: false,
      edit: false,
      read: false,
    };
    const staffPerms = await this.getStaffPerms(staff)
    const isInDomain = staff.domainId === term.domainId;
    const watchDeptIds = await this.relations.getEROBids(
      ObjectType.TERM,
      RelationType.WATCH,
      ObjectType.DEPARTMENT,
      term.id,
    );
    const watchStaffIds = await this.relations.getEROBids(
      ObjectType.TERM,
      RelationType.WATCH,
      ObjectType.STAFF,
      term.id,
    );
    const canWatch =
      watchDeptIds.includes(staff.deptId) || watchStaffIds.includes(staff.id);
    if (canWatch) {
      Object.assign(termPerms, { read: true });
    }
    const applyRolePerms = (perm: RolePerms) => {
      const handlers: RolePermsHandlers = {
        [RolePerms.EDIT_ANY_TERM]: (p) => Object.assign(p, { edit: true }),
        [RolePerms.EDIT_DOM_TERM]: (p) =>
          isInDomain && Object.assign(p, { edit: true }),
        [RolePerms.READ_DOM_TERM]: (p) =>
          isInDomain && Object.assign(p, { read: true }),
        [RolePerms.READ_ANY_TERM]: (p) => Object.assign(p, { read: true }),
        [RolePerms.DELETE_ANY_TERM]: (p) => Object.assign(p, { delete: true }),
        [RolePerms.DELETE_DOM_TERM]: (p) =>
          isInDomain && Object.assign(p, { delete: true }),
      };
      handlers[perm]?.(termPerms);
    };
    staffPerms.forEach(applyRolePerms);
    return termPerms;
  }

  /**
   * Build conditions for querying message comments.
   * @param staff - The staff details to build conditions.
   * @returns A string representing the SQL condition for message comments.
   */
  async buildCommentExtraQuery(
    staff: Staff,
    aId: string,
    aType: ObjectType,
    relationType: RelationType,
  ): Promise<string> {
    const { id: staffId, deptId } = staff;
    const ancestorDeptIds = await this.departments.getAllParentDeptIds(deptId);
    let queryString = '';
    if (relationType === RelationType.MESSAGE) {
      queryString = `
      c.id IN (
        SELECT "aId"
        FROM relations
        WHERE (
          "bId" = '${staffId}' AND 
          "bType" = '${ObjectType.STAFF}' AND 
          "aType" = '${ObjectType.COMMENT}' AND 
          "relationType" = '${RelationType.MESSAGE}'
        )
    `;

      if (ancestorDeptIds.length > 0) {
        queryString += `
        OR (
          "bId" IN (${[...ancestorDeptIds, deptId].map((id) => `'${id}'`).join(', ')}) AND 
          "bType" = '${ObjectType.DEPARTMENT}' AND 
          "aType" = '${ObjectType.COMMENT}' AND 
          "relationType" = '${RelationType.MESSAGE}'
        )
      `;
      }

      queryString += `)`;
    } else {
      queryString = `
      c.id IN (
        SELECT "bId"
        FROM relations
        WHERE (
          "aId" = '${aId}' AND 
          "aType" = '${aType}' AND 
          "bType" = '${ObjectType.COMMENT}' AND 
          "relationType" = '${relationType}'
        )
    `;
      queryString += `)`;
    }

    return queryString;
  }
  async getTermExtraConditions(staff: Staff) {
    const { domainId, id: staffId, deptId } = staff;
    const staffPerms = await this.getStaffPerms(staff)

    const ancestorDeptIds = await this.departments.getAllParentDeptIds(deptId);

    if (staffPerms.includes(RolePerms.READ_ANY_TERM)) {
      return {};
    }
    const relevantRelations = await db.relation.findMany({
      where: {
        OR: [
          {
            bId: staffId,
            bType: ObjectType.STAFF,
            aType: ObjectType.TERM,
            relationType: RelationType.WATCH,
          },
          {
            bId: { in: ancestorDeptIds },
            bType: ObjectType.DEPARTMENT,
            aType: ObjectType.TERM,
            relationType: RelationType.WATCH,
          },
        ],
      },
      select: { aId: true },
    });

    const termIds = relevantRelations.map((relation) => relation.aId);
    const ownedTermIds = await db.term.findMany({
      select: {
        id: true,
      },
      where: {
        createdBy: staffId,
      },
    });
    const conditions: Prisma.TermWhereInput = {
      OR: [
        {
          id: {
            in: [...termIds, ...ownedTermIds.map((item) => item.id)],
          },
        },
      ],
    };

    if (domainId && staffPerms.includes(RolePerms.READ_DOM_TERM)) {
      conditions.OR.push({
        OR: [{ domainId: null }, { domainId: domainId }],
      });
    }
    return conditions;
  }
}
