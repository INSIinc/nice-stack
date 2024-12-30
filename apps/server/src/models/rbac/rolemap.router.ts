import { Injectable } from '@nestjs/common';
import { TrpcService } from '@server/trpc/trpc.service';
import {
  ChangedRows,
  ObjectType,
  RoleMapMethodSchema,
} from '@nicestack/common';
import { RoleMapService } from './rolemap.service';

@Injectable()
export class RoleMapRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly roleMapService: RoleMapService,
  ) { }
  router = this.trpc.router({
    deleteAllRolesForObject: this.trpc.protectProcedure
      .input(RoleMapMethodSchema.deleteWithObject)
      .mutation(({ input }) =>
        this.roleMapService.deleteAllRolesForObject(input),
      ),
    setRoleForObject: this.trpc.protectProcedure
      .input(RoleMapMethodSchema.create)
      .mutation(({ input }) => this.roleMapService.setRoleForObject(input)),
    setRoleForObjects: this.trpc.protectProcedure
      .input(RoleMapMethodSchema.setRoleForObjects)
      .mutation(({ input }) => this.roleMapService.setRoleForObjects(input)),
    addRoleForObjects: this.trpc.protectProcedure
      .input(RoleMapMethodSchema.setRoleForObjects)
      .mutation(({ input }) => this.roleMapService.addRoleForObjects(input)),
    setRolesForObject: this.trpc.protectProcedure
      .input(RoleMapMethodSchema.setRolesForObject)
      .mutation(({ input }) => this.roleMapService.setRolesForObject(input)),

    getPermsForObject: this.trpc.procedure
      .input(RoleMapMethodSchema.getPermsForObject)
      .query(({ input }) => this.roleMapService.getPermsForObject(input)),
    deleteMany: this.trpc.protectProcedure
      .input(RoleMapMethodSchema.deleteMany) // Assuming RoleMapMethodSchema.deleteMany is the Zod schema for batch deleting staff
      .mutation(async ({ input }) => {
        return await this.roleMapService.deleteMany(input);
      }),

    paginate: this.trpc.procedure
      .input(RoleMapMethodSchema.paginate) // Define the input schema for pagination
      .query(async ({ input }) => {
        return await this.roleMapService.paginate(input);
      }),
    update: this.trpc.protectProcedure
      .input(RoleMapMethodSchema.update)
      .mutation(async ({ ctx, input }) => {
        const { staff } = ctx;
        return await this.roleMapService.update(input);
      }),
    getRoleMapDetail: this.trpc.procedure
      .input(RoleMapMethodSchema.getRoleMapDetail)
      .query(async ({ input }) => {
        return await this.roleMapService.getRoleMapDetail(input);
      }),
    getRows: this.trpc.procedure
      .input(RoleMapMethodSchema.getRows)
      .query(async ({ input, ctx }) => {
        const { staff } = ctx;
        return await this.roleMapService.getRows(input, staff);
      }),
    getStaffsNotMap: this.trpc.procedure
      .input(RoleMapMethodSchema.getStaffsNotMap)
      .query(async ({ input }) => {
        return this.roleMapService.getStaffsNotMap(input);
      }),
  });
}
