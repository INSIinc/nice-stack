import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { TaxonomyService } from './taxonomy.service';
import { TaxonomyMethodSchema } from '@nicestack/common';

@Injectable()
export class TaxonomyRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly taxonomyService: TaxonomyService,
  ) { }

  router = this.trpc.router({
    create: this.trpc.procedure
      .input(TaxonomyMethodSchema.create)
      .mutation(async ({ input }) => {
        return this.taxonomyService.create(input);
      }),
    findById: this.trpc.procedure
      .input(TaxonomyMethodSchema.findById)
      .query(async ({ input }) => {
        return this.taxonomyService.findById(input);
      }),
    findBySlug: this.trpc.procedure
      .input(TaxonomyMethodSchema.findBySlug)
      .query(async ({ input }) => {
        return this.taxonomyService.findBySlug(input);
      }),
    update: this.trpc.procedure
      .input(TaxonomyMethodSchema.update)
      .mutation(async ({ input }) => {
        return this.taxonomyService.update(input);
      }),
    delete: this.trpc.procedure
      .input(TaxonomyMethodSchema.delete)
      .mutation(async ({ input }) => {
        return this.taxonomyService.delete(input);
      }),
    deleteMany: this.trpc.procedure
      .input(TaxonomyMethodSchema.deleteMany)
      .mutation(async ({ input }) => {
        return this.taxonomyService.deleteMany(input);
      }),
    paginate: this.trpc.procedure
      .input(TaxonomyMethodSchema.paginate!)
      .query(async ({ input }) => {
        return this.taxonomyService.paginate(input);
      }),
    getAll: this.trpc.procedure
      .input(TaxonomyMethodSchema.getAll)
      .query(async ({ input }) => {
        return this.taxonomyService.getAll(input);
      }),
  });
}
