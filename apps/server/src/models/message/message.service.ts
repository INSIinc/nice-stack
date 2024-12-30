import { Injectable } from '@nestjs/common';
import { UserProfile, db, Prisma, VisitType, ObjectType } from '@nicestack/common';
import { BaseService } from '../base/base.service';
import EventBus, { CrudOperation } from '@server/utils/event-bus';
import { setMessageRelation } from './utils';
@Injectable()
export class MessageService extends BaseService<Prisma.MessageDelegate> {
  constructor() {
    super(db, ObjectType.MESSAGE);
  }
  async create(args: Prisma.MessageCreateArgs, params?: { tx?: Prisma.MessageDelegate, staff?: UserProfile }) {
    args.data.senderId = params?.staff?.id;
    args.include = {
      receivers: {
        select: { id: true, registerToken: true, username: true }
      }
    }
    const result = await super.create(args);
    EventBus.emit("dataChanged", {
      type: ObjectType.MESSAGE,
      operation: CrudOperation.CREATED,
      data: result
    })
    return result
  }
  async findManyWithCursor(
    args: Prisma.MessageFindManyArgs,
    staff?: UserProfile,
  ) {

    return this.wrapResult(super.findManyWithCursor(args), async (result) => {
      let { items } = result;
      await Promise.all(
        items.map(async (item) => {
          await setMessageRelation(item, staff);
        }),
      );

      return { ...result, items };
    });
  }
  async getUnreadCount(staff?: UserProfile) {
    const count = await db.message.count({
      where: {
        receivers: { some: { id: staff?.id } },
        visits: {
          none: {
            visitorId: staff?.id,
            visitType: VisitType.READED
          }
        }
      }
    })

    return count
  }
}
