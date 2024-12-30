import { Injectable } from '@nestjs/common';
import {
  db,
  ObjectType,
  Prisma,
} from '@nicestack/common';


import { BaseService } from '../base/base.service';
import { deleteByPattern } from '@server/utils/redis/utils';

@Injectable()
export class AppConfigService extends BaseService<Prisma.AppConfigDelegate> {
  constructor() {
    super(db, "appConfig");
  }
  async clearRowCache() {
    await deleteByPattern("row-*")
    return true
  }
}
