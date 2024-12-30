import { Injectable } from '@nestjs/common';
import { TransformService } from './transform.service';
import { TransformMethodSchema} from '@nicestack/common';
import { TrpcService } from '@server/trpc/trpc.service';

@Injectable()
export class TransformRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly transformService: TransformService,
  ) { }
  router = this.trpc.router({


    importTerms: this.trpc.protectProcedure
      .input(TransformMethodSchema.importTerms) // expect input according to the schema
      .mutation(async ({ ctx, input }) => {
        const { staff } = ctx;
        return this.transformService.importTerms(staff, input);
      }),
    importDepts: this.trpc.protectProcedure
      .input(TransformMethodSchema.importDepts) // expect input according to the schema
      .mutation(async ({ ctx, input }) => {
        const { staff } = ctx;
        return this.transformService.importDepts(staff, input);
      }),
    importStaffs: this.trpc.protectProcedure
      .input(TransformMethodSchema.importStaffs) // expect input according to the schema
      .mutation(async ({ ctx, input }) => {
        const { staff } = ctx;
        return this.transformService.importStaffs(input);
      }),

  });
}
