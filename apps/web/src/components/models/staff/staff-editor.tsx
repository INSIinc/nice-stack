import StaffList from "./staff-list";
import { ObjectType, RolePerms } from "@nicestack/common"
import { Icon } from "@nicestack/iconer"
import StaffModal from "./staff-modal";
import { createContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@web/src/providers/auth-provider";
import { Button } from "antd";
import DepartmentSelect from "../department/department-select";
import { FormInstance, useForm } from "antd/es/form/Form";
import FixedHeader from "../../layout/fix-header";
export const StaffEditorContext = createContext<{
    domainId: string,
    modalOpen: boolean,
    setDomainId: React.Dispatch<React.SetStateAction<string>>,
    setModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
    editId: string,
    setEditId: React.Dispatch<React.SetStateAction<string>>,
    form: FormInstance<any>,
    formLoading: boolean,
    setFormLoading: React.Dispatch<React.SetStateAction<boolean>>,
    canManageAnyStaff: boolean
}>({
    domainId: undefined,
    modalOpen: false,
    setDomainId: undefined,
    setModalOpen: undefined,
    editId: undefined,
    setEditId: undefined,
    form: undefined,
    formLoading: undefined,
    setFormLoading: undefined,
    canManageAnyStaff: false
});
export default function StaffEditor() {
    const [form] = useForm()
    const [domainId, setDomainId] = useState<string>();
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [editId, setEditId] = useState<string>()
    const { user, hasSomePermissions } = useAuth()
    const [formLoading, setFormLoading] = useState<boolean>()
    useEffect(() => {
        if (user) {
            setDomainId(user.domainId)
        }
    }, [user])

    const canManageStaff = useMemo(() => {
        return hasSomePermissions(RolePerms.MANAGE_ANY_STAFF, RolePerms.MANAGE_DOM_STAFF)
    }, [user])
    const canManageAnyStaff = useMemo(() => {
        return hasSomePermissions(RolePerms.MANAGE_ANY_STAFF)
    }, [user])
    return <StaffEditorContext.Provider value={{ canManageAnyStaff, formLoading, setFormLoading, form, editId, setEditId, domainId, modalOpen, setDomainId, setModalOpen }}>
        <FixedHeader roomId="staff-editor">
            <div className="flex items-center gap-4">
                <DepartmentSelect rootId={user?.domainId} onChange={(value) => setDomainId(value as string)} disabled={!canManageAnyStaff} value={domainId} className="w-48" domain={true}></DepartmentSelect>
                {canManageStaff && <Button

                    type="primary"
                    icon={<Icon name="add"></Icon>}
                    onClick={() => {
                        setModalOpen(true)
                    }}>
                    添加用户
                </Button>}
            </div>
        </FixedHeader>
        <StaffList domainId={domainId}></StaffList>
        <StaffModal></StaffModal>
    </StaffEditorContext.Provider>
}