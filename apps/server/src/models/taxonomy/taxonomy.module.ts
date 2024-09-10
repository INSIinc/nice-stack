import { Module } from '@nestjs/common';
import { TaxonomyRouter } from './taxonomy.router';
import { TaxonomyService } from './taxonomy.service';
import { TrpcService } from '@server/trpc/trpc.service';
import { RedisModule } from '@server/redis/redis.module';

@Module({
    imports: [RedisModule],
    providers: [TaxonomyRouter, TaxonomyService, TrpcService],
    exports: [TaxonomyRouter, TaxonomyService]
})
export class TaxonomyModule { }
