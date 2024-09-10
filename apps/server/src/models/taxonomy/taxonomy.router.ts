import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { TaxonomyService } from './taxonomy.service';
import { TaxonomySchema } from '@nicestack/common';

@Injectable()
export class TaxonomyRouter {
    constructor(
        private readonly trpc: TrpcService,
        private readonly taxonomyService: TaxonomyService
    ) { }

    router = this.trpc.router({
        create: this.trpc.procedure.input(TaxonomySchema.create).mutation(async ({ input }) => {
            return this.taxonomyService.create(input);
        }),

        findById: this.trpc.procedure.input(TaxonomySchema.findById).query(async ({ input }) => {
            return this.taxonomyService.findById(input);
        }),

        update: this.trpc.procedure.input(TaxonomySchema.update).mutation(async ({ input }) => {
            return this.taxonomyService.update(input);
        }),

        delete: this.trpc.procedure.input(TaxonomySchema.delete).mutation(async ({ input }) => {
            return this.taxonomyService.delete(input);
        }),

        batchDelete: this.trpc.procedure.input(TaxonomySchema.batchDelete).mutation(async ({ input }) => {
            return this.taxonomyService.batchDelete(input);
        }),

        paginate: this.trpc.procedure.input(TaxonomySchema.paginate!).query(async ({ input }) => {
            return this.taxonomyService.paginate(input);
        }),

        getAll: this.trpc.procedure.query(() => {
            return this.taxonomyService.getAll();
        })
    });
}
