import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { DepartmentService } from './department.service';
import { AuthGuard } from '@server/auth/auth.guard';
import { db } from '@nicestack/common';

@Controller('dept')
export class DepartmentController {
  constructor(private readonly deptService: DepartmentService) { }
  @UseGuards(AuthGuard)
  @Get('get-detail')
  async getDepartmentDetails(@Query('dept-id') deptId: string) {
    try {
      const result = await this.deptService.findById(deptId);
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
  @Get('get-all-child-dept-ids')
  async getAllChildDeptIds(@Query('dept-id') deptId: string) {
    try {
      const result = await this.deptService.getDescendantIds([deptId]);

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
  @Get('get-all-parent-dept-ids')
  async getAllParentDeptIds(@Query('dept-id') deptId: string) {
    try {
      const result = await this.deptService.getAncestorIds([deptId]);

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
  @Get('find-by-name-in-dom')
  async findInDomain(
    @Query('domain-id') domainId?: string,
    @Query('name') name?: string,
  ) {
    try {
      const result = await this.deptService.findInDomain(domainId, name);
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
