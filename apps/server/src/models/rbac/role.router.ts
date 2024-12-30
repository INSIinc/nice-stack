import { Injectable } from "@nestjs/common";
import { TrpcService } from "@server/trpc/trpc.service";
import { RoleService } from "./role.service";
import {  RoleMethodSchema } from "@nicestack/common";
import { z } from "zod";

@Injectable()
export class RoleRouter {
    constructor(
        private readonly trpc: TrpcService,
        private readonly roleService: RoleService
    ) { }

    router = this.trpc.router({
        create: this.trpc.protectProcedure.input(RoleMethodSchema.create).mutation(async ({ ctx, input }) => {
            const { staff } = ctx;
            return await this.roleService.create(input);
        }),
        deleteMany: this.trpc.protectProcedure.input(RoleMethodSchema.deleteMany).mutation(async ({ input }) => {
            return await this.roleService.deleteMany(input);
        }),
        update: this.trpc.protectProcedure.input(RoleMethodSchema.update).mutation(async ({ ctx, input }) => {
            const { staff } = ctx;
            return await this.roleService.update(input);
        }),
        paginate: this.trpc.protectProcedure.input(RoleMethodSchema.paginate).query(async ({ ctx, input }) => {
            const { staff } = ctx;
            return await this.roleService.paginate(input);
        }),
        findById: this.trpc.protectProcedure
            .input(z.object({ id: z.string().nullish() }))
            .query(async ({ ctx, input }) => {
                const { staff } = ctx;
                return await this.roleService.findById(input.id);
            }),
        findMany: this.trpc.procedure
            .input(RoleMethodSchema.findMany) // Assuming StaffMethodSchema.findMany is the Zod schema for finding staffs by keyword
            .query(async ({ input }) => {
                return await this.roleService.findMany(input);
            })
    }
    )
}

