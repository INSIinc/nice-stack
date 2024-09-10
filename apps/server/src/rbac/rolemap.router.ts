import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import { RoleMapSchema } from '@nicestack/common';
import { RoleMapService } from './rolemap.service';
@Injectable()
export class RoleMapRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly roleMapService: RoleMapService,
  ) { }
  router = this.trpc.router({
    deleteAllRolesForObject: this.trpc.protectProcedure
      .input(RoleMapSchema.deleteWithObject)
      .mutation(({ input }) =>
        this.roleMapService.deleteAllRolesForObject(input),
      ),
    setRoleForObject: this.trpc.protectProcedure
      .input(RoleMapSchema.create)
      .mutation(({ input }) => this.roleMapService.setRoleForObject(input)),
    createManyObjects: this.trpc.protectProcedure
      .input(RoleMapSchema.createManyObjects)
      .mutation(({ input }) => this.roleMapService.createManyObjects(input)),
    setRolesForObject: this.trpc.protectProcedure
      .input(RoleMapSchema.createManyRoles)
      .mutation(({ input }) => this.roleMapService.setRolesForObject(input)),

    getPermsForObject: this.trpc.procedure
      .input(RoleMapSchema.getPermsForObject)
      .query(({ input }) => this.roleMapService.getPermsForObject(input)),
    batchDelete: this.trpc.protectProcedure
      .input(RoleMapSchema.batchDelete) // Assuming RoleMapSchema.batchDelete is the Zod schema for batch deleting staff
      .mutation(async ({ input }) => {
        return await this.roleMapService.batchDelete(input);
      }),

    paginate: this.trpc.procedure
      .input(RoleMapSchema.paginate) // Define the input schema for pagination
      .query(async ({ input }) => {
        return await this.roleMapService.paginate(input);
      }),
    update: this.trpc.protectProcedure
      .input(RoleMapSchema.update)
      .mutation(async ({ ctx, input }) => {
        const { staff } = ctx;
        return await this.roleMapService.update(input);
      }),
    getRoleMapDetail: this.trpc.procedure
      .input(RoleMapSchema.getRoleMapDetail)
      .query(async ({ input }) => {
        return await this.roleMapService.getRoleMapDetail(input);
      }),
  });
}
