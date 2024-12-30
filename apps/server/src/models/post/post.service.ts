import { Injectable } from '@nestjs/common';
import {
  db,
  Prisma,
  UserProfile,
  VisitType,
  Post,
  PostType,
  RolePerms,
  ResPerm,
  ObjectType,
} from '@nicestack/common';
import { MessageService } from '../message/message.service';
import { BaseService } from '../base/base.service';
import { DepartmentService } from '../department/department.service';
import { setPostRelation } from './utils';
import EventBus, { CrudOperation } from '@server/utils/event-bus';

@Injectable()
export class PostService extends BaseService<Prisma.PostDelegate> {
  constructor(
    private readonly messageService: MessageService,
    private readonly departmentService: DepartmentService,
  ) {
    super(db, ObjectType.POST);
  }
  async create(
    args: Prisma.PostCreateArgs,
    params: { staff?: UserProfile; tx?: Prisma.PostDelegate },
  ) {
    args.data.authorId = params?.staff.id;
    const result = await super.create(args);
    EventBus.emit('dataChanged', {
      type: ObjectType.POST,
      operation: CrudOperation.CREATED,
      data: result,
    });
    return result;
  }
  async update(args: Prisma.PostUpdateArgs, staff?: UserProfile) {
    args.data.authorId = staff.id;
    return super.update(args);
  }
  async findManyWithCursor(args: Prisma.PostFindManyArgs, staff?: UserProfile) {
    args.where.OR = await this.preFilter(args.where.OR, staff);

    // console.log(`findwithcursor_post ${JSON.stringify(args.where)}`)
    return this.wrapResult(super.findManyWithCursor(args), async (result) => {
      let { items } = result;
      await Promise.all(
        items.map(async (item) => {
          await setPostRelation({ data: item, staff });
          await this.setPerms(item, staff);
        }),
      );
      return { ...result, items };
    });
  }

  protected async setPerms(data: Post, staff: UserProfile) {
    if (!staff) return;
    const perms: ResPerm = {
      delete: false,
    };
    const isMySelf = data?.authorId === staff?.id;
    const isDomain = staff.domainId === data.domainId;
    const setManagePermissions = (perms: ResPerm) => {
      Object.assign(perms, {
        delete: true,
        // edit: true,
      });
    };
    if (isMySelf) {
      perms.delete = true;
      // perms.edit = true;
    }
    staff.permissions.forEach((permission) => {
      switch (permission) {
        case RolePerms.MANAGE_ANY_POST:
          setManagePermissions(perms);
          break;
        case RolePerms.MANAGE_DOM_POST:
          if (isDomain) {
            setManagePermissions(perms);
          }
          break;
      }
    });
    Object.assign(data, { perms });
  }
  async preFilter(OR?: Prisma.PostWhereInput[], staff?: UserProfile) {
    const preFilter = (await this.getPostPreFilter(staff)) || [];
    const outOR = OR ? [...OR, ...preFilter].filter(Boolean) : preFilter;
    return outOR?.length > 0 ? outOR : undefined;
  }
  async getPostPreFilter(staff: UserProfile) {
    const { deptId, domainId } = staff;
    if (
      staff.permissions.includes(RolePerms.READ_ANY_POST) ||
      staff.permissions.includes(RolePerms.MANAGE_ANY_POST)
    ) {
      return undefined;
    }
    const parentDeptIds =
      (await this.departmentService.getAncestorIds(staff.deptId)) || [];
    const orCondition: Prisma.PostWhereInput[] = [
      staff?.id && {
        authorId: staff.id,
      },
      staff?.id && {
        watchStaffs: {
          some: {
            id: staff.id,
          },
        },
      },
      deptId && {
        watchDepts: {
          some: {
            id: {
              in: parentDeptIds,
            },
          },
        },
      },

      {
        AND: [
          {
            watchStaffs: {
              none: {}, // 匹配 watchStaffs 为空
            },
          },
          {
            watchDepts: {
              none: {}, // 匹配 watchDepts 为空
            },
          },
        ],
      },
    ].filter(Boolean);

    if (orCondition?.length > 0) return orCondition;
    return undefined;
  }
}
