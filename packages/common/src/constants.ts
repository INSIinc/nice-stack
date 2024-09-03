import { RolePerms } from "./enum";

export const InitRoles: { name: string, permissions: string[], system?: boolean }[] = [
    {
        name: "基层",
        permissions: [
            RolePerms.CREATE_TROUBLE,
            RolePerms.CREATE_WORKPROGRESS,
        ]
    },
    {
        name: "机关",
        permissions: [
            RolePerms.CREATE_TROUBLE,
            RolePerms.CREATE_WORKPROGRESS,
        ],
    },
    {
        name: "领导",
        permissions: [
            RolePerms.READ_DOM_TROUBLE,
            RolePerms.CREATE_INSTRUCTION,
        ],
    },
    {
        name: "域管理员",
        permissions: Object.keys(RolePerms).filter(
            (perm) =>
                ![
                    RolePerms.READ_ANY_CHART,
                    RolePerms.READ_ANY_TROUBLE,
                    RolePerms.READ_ANY_TERM,
                    RolePerms.PROCESS_ANY_ASSESSMENT,
                    RolePerms.PROCESS_ANY_TROUBLE,
                    RolePerms.EDIT_ROOT_OPTION,
                    RolePerms.EDIT_ANY_TERM,
                    RolePerms.EDIT_ANY_TROUBLE,
                    RolePerms.EDIT_ANY_ASSESSMENT,
                    RolePerms.DELETE_ANY_TROUBLE,
                    RolePerms.DELETE_ANY_TERM,
                    RolePerms.DELETE_ANY_ASSESSMENT,
                ].includes(perm as any)
        ) as RolePerms[],
    },
    {
        name: "根管理员",
        permissions: Object.keys(RolePerms) as RolePerms[],
    },
];
export const InitTaxonomies: { name: string }[] = [{
    name: '分类'
},
{
    name: '研判单元'
}]