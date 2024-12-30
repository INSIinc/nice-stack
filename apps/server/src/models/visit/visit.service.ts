import { Injectable } from '@nestjs/common';
import { BaseService } from '../base/base.service';
import {
  UserProfile,
  db,
  ObjectType,
  Prisma,
  VisitType,
} from '@nicestack/common';
import EventBus from '@server/utils/event-bus';
@Injectable()
export class VisitService extends BaseService<Prisma.VisitDelegate> {
  constructor() {
    super(db, ObjectType.VISIT);
  }
  async create(args: Prisma.VisitCreateArgs, staff?: UserProfile) {
    const { postId, troubleId, messageId } = args.data;
    const visitorId = args.data.visitorId || staff?.id;
    let result;
    const existingVisit = await db.visit.findFirst({
      where: {
        visitType: args.data.visitType,
        visitorId,
        OR: [{ postId }, { troubleId }, { messageId }],
      },
    });
    if (!existingVisit) {
      result = await super.create(args);
    } else if (args.data.visitType === VisitType.READED) {
      result = await super.update({
        where: { id: existingVisit.id },
        data: {
          ...args.data,
          views: existingVisit.views + 1,
        },
      });
    }

    if (troubleId && args.data.visitType === VisitType.READED) {
      EventBus.emit('updateViewCount', {
        objectType: ObjectType.TROUBLE,
        id: troubleId,
      });
    }
    return result;
  }
  async createMany(args: Prisma.VisitCreateManyArgs, staff?: UserProfile) {
    const data = Array.isArray(args.data) ? args.data : [args.data];
    const updatePromises = [];
    const createData = [];
    await Promise.all(
      data.map(async (item) => {
        item.visitorId = item.visitorId || staff?.id;
        const { postId, troubleId, messageId, visitorId } = item;
        const existingVisit = await db.visit.findFirst({
          where: {
            visitorId,
            OR: [{ postId }, { troubleId }, { messageId }],
          },
        });

        if (existingVisit) {
          updatePromises.push(
            super.update({
              where: { id: existingVisit.id },
              data: {
                ...item,
                views: existingVisit.views + 1,
              },
            }),
          );
        } else {
          createData.push(item);
        }
      }),
    );
    // Execute all updates in parallel
    await Promise.all(updatePromises);
    // Create new visits for those not existing
    if (createData.length > 0) {
      return super.createMany({
        ...args,
        data: createData,
      });
    }

    return { count: updatePromises.length }; // Return the number of updates if no new creates
  }
}
