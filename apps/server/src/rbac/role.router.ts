import { Injectable } from "@nestjs/common";
import { TrpcService } from "@server/trpc/trpc.service";
import { RoleService } from "./role.service";
import { z, RoleSchema } from "@nicestack/common";

@Injectable()
export class RoleRouter {
    constructor(
        private readonly trpc: TrpcService,
        private readonly roleService: RoleService
    ) { }

    router = this.trpc.router({
        create: this.trpc.protectProcedure.input(RoleSchema.create).mutation(async ({ ctx, input }) => {
            const { staff } = ctx;
            return await this.roleService.create(input);
        }),
        batchDelete: this.trpc.protectProcedure.input(RoleSchema.batchDelete).mutation(async ({ input }) => {
            return await this.roleService.batchDelete(input);
        }),
        update: this.trpc.protectProcedure.input(RoleSchema.update).mutation(async ({ ctx, input }) => {
            const { staff } = ctx;
            return await this.roleService.update(input);
        }),
        paginate: this.trpc.protectProcedure.input(RoleSchema.paginate).query(async ({ ctx, input }) => {
            const { staff } = ctx;
            return await this.roleService.paginate(input);
        }),
        findMany: this.trpc.procedure
            .input(RoleSchema.findMany) // Assuming StaffSchema.findMany is the Zod schema for finding staffs by keyword
            .query(async ({ input }) => {
                return await this.roleService.findMany(input);
            })
    }
    )
}

