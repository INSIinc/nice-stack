import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { MessageService } from './message.service';
import { AuthGuard } from '@server/auth/auth.guard';
import { db, VisitType } from '@nicestack/common';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) { }
  @UseGuards(AuthGuard)
  @Get('find-last-one')
  async findLastOne(@Query('staff-id') staffId: string) {
    try {
      const result = await db.message.findFirst({
        where: {
          OR: [
            {
              receivers: {
                some: {
                  id: staffId,
                },
              },
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          title: true,
          content: true,
          url: true
        },
      });

      return {
        data: result,
        errmsg: 'success',
        errno: 0,
      };
    } catch (e) {
      return {
        data: {},
        errmsg: (e as any)?.message || 'error',
        errno: 1,
      };
    }
  }
  @UseGuards(AuthGuard)
  @Get('find-unreaded')
  async findUnreaded(@Query('staff-id') staffId: string) {
    try {
      const result = await db.message.findMany({
        where: {
          visits: {
            none: {
              id: staffId,
              visitType: VisitType.READED
            },
          },
          receivers: {
            some: {
              id: staffId,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          title: true,
          content: true,
          url: true,
        },
      });

      return {
        data: result,
        errmsg: 'success',
        errno: 0,
      };
    } catch (e) {
      return {
        data: {},
        errmsg: (e as any)?.message || 'error',
        errno: 1,
      };
    }
  }
  @UseGuards(AuthGuard)
  @Get('count-unreaded')
  async countUnreaded(@Query('staff-id') staffId: string) {
    try {
      const result = await db.message.findMany({
        where: {
          visits: {
            none: {
              id: staffId,
              visitType: VisitType.READED
            },
          },
          receivers: {
            some: {
              id: staffId,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          title: true,
          content: true,
          url: true,
        },
      });

      return {
        data: result,
        errmsg: 'success',
        errno: 0,
      };
    } catch (e) {
      return {
        data: {},
        errmsg: (e as any)?.message || 'error',
        errno: 1,
      };
    }
  }
}
