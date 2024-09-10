import { z } from "zod"
import { ObjectType } from "./enum";
export const AuthSchema = {
    signInRequset: z.object({
        username: z.string(),
        password: z.string(),
        phoneNumber: z.string().nullish()
    }),
    signUpRequest: z.object({
        username: z.string(),
        password: z.string(),
        phoneNumber: z.string().nullish()
    }),
    changePassword: z.object({
        username: z.string(),
        phoneNumber: z.string().nullish(),
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
        phoneNumber: z.string().nullish()
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
export const TaxonomySchema = {
    create: z.object({
        name: z.string(),
        // slug: z.string().min(1), // Assuming slug cannot be empty
    }),
    delete: z.object({
        id: z.string(),
    }),
    findByName: z.object({
        name: z.string(),
    }),
    findById: z.object({
        id: z.string(),
    }),
    batchDelete: z.object({
        ids: z.array(z.string()),
    }),
    update: z.object({
        id: z.string(),
        name: z.string().nullish(),
        // slug: z.string().nullish(),
        order: z.number().nullish(),
    }),
    paginate: z.object({
        page: z.number().min(1),
        pageSize: z.number().min(1),
    }),
};
export const TermSchema = {
    create: z.object({
        name: z.string(),
        description: z.string().nullish(),
        domainId: z.string().nullish(),
        // slug: z.string().min(1), // Assuming slug cannot be empty
        parentId: z.string().nullish(), // Optional field
        taxonomyId: z.string(), // Optional field
        watchStaffIds: z.array(z.string()).nullish(),
        watchDeptIds: z.array(z.string()).nullish(),
    }),
    update: z.object({
        id: z.string(),
        description: z.string().nullish(),
        parentId: z.string().nullish(),
        domainId: z.string().nullish(),
        name: z.string().nullish(),
        // slug: z.string().nullish(),
        taxonomyId: z.string().nullish(),
        order: z.number().nullish(),
        watchStaffIds: z.array(z.string()).nullish(),
        watchDeptIds: z.array(z.string()).nullish(),
    }),
    delete: z.object({
        id: z.string(),
    }),
    paginate: z.object({
        page: z.number().min(1),
        pageSize: z.number().min(1),
    }),
    batchDelete: z.object({
        ids: z.array(z.string()),
    }),
    cursorList: z.object({
        cursor: z.string().nullish(),
        search: z.string().nullish(),
        limit: z.number().min(1).max(100).nullish(),
        taxonomyId: z.string(),
        id: z.string(),
    }),
    getChildren: z.object({
        parentId: z.string().nullish(),
        domainId: z.string().nullish(),
        taxonomyId: z.string().nullish(),
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(100).nullish(),
    }),
    findMany: z.object({
        keyword: z.string().nullish(),
        ids: z.array(z.string()).nullish(),
        taxonomyId: z.string().nullish(),
    }),
};
export const TransformSchema = {
    importStaffs: z.object({
        base64: z.string(),
        domainId: z.string().nullish(),
    }),
    importTerms: z.object({
        base64: z.string(),
        domainId: z.string().nullish(),
        taxonomyId: z.string().nullish(),
        parentId: z.string().nullish(),
    }),
    importDepts: z.object({
        base64: z.string(),
        domainId: z.string().nullish(),
        parentId: z.string().nullish(),
    }),

};
