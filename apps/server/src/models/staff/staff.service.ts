import { Injectable } from '@nestjs/common';
import {
  db,
  StaffMethodSchema,
  ObjectType,
  UserProfile,
  Prisma,
} from '@nicestack/common';
import { DepartmentService } from '../department/department.service';
import { z } from 'zod';
import { BaseService } from '../base/base.service';
import * as argon2 from 'argon2';
import EventBus, { CrudOperation } from '@server/utils/event-bus';

@Injectable()
export class StaffService extends BaseService<Prisma.StaffDelegate> {

  constructor(private readonly departmentService: DepartmentService) {
    super(db, ObjectType.STAFF, true);
  }
  /**
   *  获取某一单位下所有staff的记录
   * @param deptId 单位的id
   * @returns 查到的staff记录
   */
  async findByDept(data: z.infer<typeof StaffMethodSchema.findByDept>) {
    const { deptId, domainId } = data;
    const childDepts = await this.departmentService.getDescendantIds(deptId, true);
    const result = await db.staff.findMany({
      where: {
        deptId: { in: childDepts },
        domainId,
      },
    });
    return result;
  }
  async create(args: Prisma.StaffCreateArgs) {
    const { data } = args;
    await this.validateUniqueFields(data);
    const createData = {
      ...data,
      password: await argon2.hash((data.password || '123456') as string),
    };
    const result = await super.create({ ...args, data: createData });
    this.emitDataChangedEvent(result, CrudOperation.CREATED);
    return result;
  }
  async update(args: Prisma.StaffUpdateArgs) {
    const { data, where } = args;
    await this.validateUniqueFields(data, where.id);
    const updateData = {
      ...data,
      ...(data.password && { password: await argon2.hash(data.password as string) })
    };
    const result = await super.update({ ...args, data: updateData });
    this.emitDataChangedEvent(result, CrudOperation.UPDATED);
    return result;
  }
  private async validateUniqueFields(data: any, excludeId?: string) {
    const uniqueFields = [
      { field: 'officerId', errorMsg: (val: string) => `证件号为${val}的用户已存在` },
      { field: 'phoneNumber', errorMsg: (val: string) => `手机号为${val}的用户已存在` },
      { field: 'username', errorMsg: (val: string) => `帐号为${val}的用户已存在` }
    ];
    for (const { field, errorMsg } of uniqueFields) {
      if (data[field]) {
        const count = await db.staff.count({
          where: {
            [field]: data[field],
            ...(excludeId && { id: { not: excludeId } })
          }
        });
        if (count > 0) {
          throw new Error(errorMsg(data[field]));
        }
      }
    }
  }


  private emitDataChangedEvent(data: any, operation: CrudOperation) {
    EventBus.emit("dataChanged", {
      type: this.objectType,
      operation,
      data,
    });
  }

  /**
  * 更新员工DomainId
  * @param data 包含domainId对象
  * @returns 更新后的员工记录
  */
  async updateUserDomain(data: { domainId?: string }, staff?: UserProfile) {
    let { domainId } = data;
    if (staff.domainId !== domainId) {
      const result = await this.update({
        where: { id: staff.id },
        data: {
          domainId,
          deptId: null,
        },
      });
      return result;
    } else {
      return staff;
    }
  }


  // /**
  //  * 根据关键词或ID集合查找员工
  //  * @param data 包含关键词、域ID和ID集合的对象
  //  * @returns 匹配的员工记录列表
  //  */
  // async findMany(data: z.infer<typeof StaffMethodSchema.findMany>) {
  //   const { keyword, domainId, ids, deptId, limit = 30 } = data;
  //   const idResults = ids
  //     ? await db.staff.findMany({
  //       where: {
  //         id: { in: ids },
  //         deletedAt: null,
  //         domainId,
  //         deptId,
  //       },
  //       select: {
  //         id: true,
  //         showname: true,
  //         username: true,
  //         deptId: true,
  //         domainId: true,
  //         department: true,
  //         domain: true,
  //       },
  //     })
  //     : [];

  //   const mainResults = await db.staff.findMany({
  //     where: {
  //       deletedAt: null,
  //       domainId,
  //       deptId,
  //       OR: (keyword || ids) && [
  //         { showname: { contains: keyword } },
  //         {
  //           username: {
  //             contains: keyword,
  //           },
  //         },
  //         { phoneNumber: { contains: keyword } },
  //         // {
  //         //   id: { in: ids },
  //         // },
  //       ],
  //     },
  //     select: {
  //       id: true,
  //       showname: true,
  //       username: true,
  //       deptId: true,
  //       domainId: true,
  //       department: true,
  //       domain: true,
  //     },
  //     orderBy: { order: 'asc' },
  //     take: limit !== -1 ? limit : undefined,
  //   });
  //   // Combine results, ensuring no duplicates
  //   const combinedResults = [
  //     ...mainResults,
  //     ...idResults.filter(
  //       (idResult) =>
  //         !mainResults.some((mainResult) => mainResult.id === idResult.id),
  //     ),
  //   ];

  //   return combinedResults;
  // }

}
