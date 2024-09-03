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
export interface TokenPayload {
    id: string;
    username: string;
}