import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { PostService } from './post.service';
import { AuthGuard } from '@server/auth/auth.guard';
import { db } from '@nicestack/common';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) { }
  @UseGuards(AuthGuard)
  @Get('find-last-one')
  async findLastOne(@Query('trouble-id') troubleId: string) {
    try {
      const result = await this.postService.findFirst({
        where: { referenceId: troubleId },
        orderBy: { createdAt: 'desc' }
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
  @Get('find-all')
  async findAll(@Query('trouble-id') troubleId: string) {
    try {
      const result = await db.post.findMany({
        where: {
          OR: [{ referenceId: troubleId }],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          title: true,
          content: true,
          attachments: true,
          type: true,
          author: {
            select: {
              id: true,
              showname: true,
              username: true,
            },
          },
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
  @Get('count')
  async count(@Query('trouble-id') troubleId: string) {
    try {
      const result = await db.post.count({
        where: {
          OR: [{ referenceId:  troubleId  }],
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
