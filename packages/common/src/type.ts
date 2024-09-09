import { Department, Staff } from "@prisma/client";

export interface DataNode {
    title: any;
    key: string;
    hasChildren?: boolean;
    children?: DataNode[];
    value: string;
    data?: any;
    isLeaf?: boolean;
}
export type StaffDto = Staff & {
    domain?: Department;
    department?: Department;
};
export type UserProfile = Staff & {
    permissions: string[];
    department?: Department;
    domain?: Department;
}

export interface JwtPayload {
    sub: string;
    username: string;
}
export interface GenPerms {
    instruction?: boolean;
    createProgress?: boolean;
    requestCancel?: boolean;
    acceptCancel?: boolean;

    conclude?: boolean;
    createRisk?: boolean;
    editIndicator?: boolean;
    editMethod?: boolean;
    editOrg?: boolean;

    edit?: boolean;
    delete?: boolean;
    read?: boolean;
}