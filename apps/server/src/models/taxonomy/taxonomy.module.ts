import { Module } from '@nestjs/common';
import { TaxonomyRouter } from './taxonomy.router';
import { TaxonomyService } from './taxonomy.service';
import { TrpcService } from '@server/trpc/trpc.service';
import { TaxonomyController } from './taxonomy.controller';

@Module({
  providers: [TaxonomyRouter, TaxonomyService, TrpcService],
  exports: [TaxonomyRouter, TaxonomyService],
  controllers: [TaxonomyController],
})
export class TaxonomyModule {}
