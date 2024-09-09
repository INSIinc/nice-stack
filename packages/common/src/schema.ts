import { z } from "zod"
import { ObjectType } from "./enum";
export const AuthSchema = {
    signInRequset: z.object({
        username: z.string(),
        password: z.string(),
    }),
    signUpRequest: z.object({
        username: z.string(),
        password: z.string(),
    }),
    changePassword: z.object({
        username: z.string(),
        oldPassword: z.string(),
        newPassword: z.string(),
    }),
    refreshTokenRequest: z.object({
        refreshToken: z.string(),
    }),
    logoutRequest: z.object({
        refreshToken: z.string(),
    })
};
export const StaffSchema = {
    create: z.object({
        username: z.string(),
        password: z.string(),
        domainId: z.string().nullish(),
    }),
    update: z.object({
        id: z.string(),
        name: z.string().nullish(),
        password: z.string().nullish(),
        domainId: z.string().nullish(),
        deptId: z.string().nullish(),
        phoneNumber: z.string().nullish(),
        order: z.number().nullish(),
        registerToken: z.string().nullish(),
    }),
    delete: z.object({
        id: z.string(),
    }),
    batchDelete: z.object({
        ids: z.array(z.string()),
    }),
    findByDept: z.object({
        deptId: z.string(),
        domainId: z.string().nullish(),
    }),
    findMany: z.object({
        keyword: z.string().nullish(),
        domainId: z.string().nullish(),
        ids: z.array(z.string()).nullish(),
    }),
    findUnique: z.object({

        id: z.string().nullish(),
    }),
    paginate: z.object({
        page: z.number(),
        pageSize: z.number(),
        domainId: z.string().nullish(),
        deptId: z.string().nullish(),
        ids: z.array(z.string()).nullish(),
    }),
};
export const DepartmentSchema = {
    create: z.object({
        name: z.string(),
        parentId: z.string().nullish(),
        isDomain: z.boolean().nullish(),
    }),
    update: z.object({
        id: z.string(),
        name: z.string().nullish(),
        parentId: z.string().nullish(),
        deletedAt: z.date().nullish(),
        order: z.number().nullish(),
        isDomain: z.boolean().nullish(),
    }),
    delete: z.object({
        id: z.string(),
    }),
    findMany: z.object({
        keyword: z.string().nullish(),
        ids: z.array(z.string()).nullish(),
    }),
    paginate: z.object({
        page: z.number(),
        pageSize: z.number(),
        ids: z.array(z.string()).nullish(),
    }),
};
export const RoleMapSchema = {
    create: z.object({
        objectId: z.string(),
        roleId: z.string(),
        domainId: z.string(),
        objectType: z.nativeEnum(ObjectType),
    }),
    update: z.object({
        id: z.string(),
        objectId: z.string().nullish(),
        roleId: z.string().nullish(),
        domainId: z.string().nullish(),
        objectType: z.nativeEnum(ObjectType).nullish(),
    }),
    createManyRoles: z.object({
        objectId: z.string(),
        roleIds: z.array(z.string()),
        domainId: z.string(),
        objectType: z.nativeEnum(ObjectType),
    }),
    createManyObjects: z.object({
        objectIds: z.array(z.string()),
        roleId: z.string(),
        domainId: z.string().nullish(),
        objectType: z.nativeEnum(ObjectType),
    }),
    batchDelete: z.object({
        ids: z.array(z.string()),
    }),
    paginate: z.object({
        page: z.number().min(1),
        pageSize: z.number().min(1),
        domainId: z.string().nullish(),
        roleId: z.string().nullish(),
    }),
    deleteWithObject: z.object({
        objectId: z.string(),
    }),

    getRoleMapDetail: z.object({
        roleId: z.string(),
        domainId: z.string().nullish(),
    }),
    getPermsForObject: z.object({
        domainId: z.string(),
        staffId: z.string(),
        deptId: z.string(),
    }),
};
export const RoleSchema = {
    create: z.object({
        name: z.string(),
        permissions: z.array(z.string()).nullish(),
    }),
    update: z.object({
        id: z.string(),
        name: z.string().nullish(),
        permissions: z.array(z.string()).nullish(),
    }),
    batchDelete: z.object({
        ids: z.array(z.string()),
    }),
    paginate: z.object({
        page: z.number().nullish(),
        pageSize: z.number().nullish(),
    }),
    findMany: z.object({
        keyword: z.string().nullish(),
    }),
};
