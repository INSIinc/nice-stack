import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { StaffService } from './staff.service';
import { AuthGuard } from '@server/auth/auth.guard';
import { db } from '@nicestack/common';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}
  @UseGuards(AuthGuard)
  @Get('find-by-id')
  async findById(@Query('id') id: string) {
    try {
      const result = await this.staffService.findById(id);
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
  @Get('find-by-dept')
  async findByDept(
    @Query('dept-id') deptId: string,
    @Query('domain-id') domainId: string,
  ) {
    try {
      const result = await this.staffService.findByDept({ deptId, domainId });
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
