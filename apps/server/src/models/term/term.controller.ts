import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { TermService } from './term.service';
import { AuthGuard } from '@server/auth/auth.guard';
import { db } from '@nicestack/common';

@Controller('term')
export class TermController {
  constructor(private readonly termService: TermService) {}
  @UseGuards(AuthGuard)
  @Get('get-tree-data')
  async getTreeData(@Query('tax-id') taxId: string) {
    try {
      const result = await this.termService.getTreeData({ taxonomyId: taxId });
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
