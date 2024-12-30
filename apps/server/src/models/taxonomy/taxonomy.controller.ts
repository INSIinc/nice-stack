import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { TaxonomyService } from './taxonomy.service';
import { AuthGuard } from '@server/auth/auth.guard';
import { db } from '@nicestack/common';

@Controller('tax')
export class TaxonomyController {
  constructor(private readonly taxService: TaxonomyService) {}
  @UseGuards(AuthGuard)
  @Get('find-by-id')
  async findById(@Query('id') id: string) {
    try {
      const result = await this.taxService.findById({ id });
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
