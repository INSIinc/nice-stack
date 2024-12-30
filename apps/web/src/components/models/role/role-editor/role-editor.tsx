import { createContext, useMemo, useState } from "react";
import AssignList from "./assign-list";
import RoleList from "./role-list";

import RoleStaffModal from "./role-staff-modal";
import { useAuth } from "@web/src/providers/auth-provider";
import { Role, RolePerms } from "@nicestack/common"
import RoleModal from "./role-modal";
import { FormInstance, useForm } from "antd/es/form/Form";
// 扩展上下文类型以包括 mapStaffIds 和 setMapStaffIds
export const RoleEditorContext = createContext<{
    role: Role,
    domainId: string,
    modalOpen: boolean,
    mapStaffIds: string[],
    setRole: React.Dispatch<React.SetStateAction<Role>>,
    setDomainId: React.Dispatch<React.SetStateAction<string>>,
    setModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setMapStaffIds: React.Dispatch<React.SetStateAction<string[]>>,
    canManageRole: boolean,
    editRoleId: string,
    setEditRoleId: React.Dispatch<React.SetStateAction<string>>,
    roleModalOpen: boolean,
    setRoleModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    roleForm: FormInstance<any>,
    
}>({
    role: undefined,
    domainId: undefined,
    modalOpen: false,
    mapStaffIds: [],
    setRole: undefined,
    setDomainId: undefined,
    setModalOpen: undefined,
    setMapStaffIds: undefined,
    canManageRole: false,
    editRoleId: undefined,
    setEditRoleId: undefined,
    roleModalOpen: undefined,
    roleForm: undefined,
    setRoleModalOpen: undefined
});

export default function RoleEditor() {
    const [role, setRole] = useState<Role>();
    const [editRoleId, setEditRoleId] = useState<string>();
    const [domainId, setDomainId] = useState<string>();
    const [roleForm] = useForm()
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
    const [mapStaffIds, setMapStaffIds] = useState<string[]>([]); // 初始化为空数组
    const { user, hasSomePermissions } = useAuth()
    const canManageRole = useMemo(() => {
        return hasSomePermissions(RolePerms.MANAGE_ANY_ROLE, RolePerms.MANAGE_DOM_ROLE)
    }, [user])
    return (
        <RoleEditorContext.Provider value={{
            roleForm,
            roleModalOpen,
            setRoleModalOpen,
            editRoleId,
            setEditRoleId,
            role,
            domainId,
            modalOpen,
            mapStaffIds,
            setRole,
            setDomainId,
            setModalOpen,
            setMapStaffIds,
            canManageRole
        }}>
            <div className="flex">
                <RoleList />
                <AssignList />

            </div>
            <RoleStaffModal />
            <RoleModal></RoleModal>
        </RoleEditorContext.Provider>
    );
}
