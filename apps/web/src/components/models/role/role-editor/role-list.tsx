import { ObjectType, Role, RolePerms } from "@nicestack/common"
import { DeleteOutlined, EditFilled, EditOutlined, EllipsisOutlined, PlusOutlined, UserOutlined } from "@ant-design/icons";
import { useRole } from "@nicestack/client";
import { Button, theme } from "antd";
import { useContext, useEffect, useMemo, useState } from "react";
import { RoleEditorContext } from "./role-editor";
import { api } from "@nicestack/client"
import { useAuth } from "@web/src/providers/auth-provider";
import { Menu, MenuItem } from "@web/src/components/presentation/dropdown-menu";

const OpreationRenderer = ({ data }: { data: Role }) => {
    const { deleteMany } = useRole()
    const { editRoleId, setEditRoleId, setRoleModalOpen } = useContext(RoleEditorContext)
    return (
        <div>
            <Menu
                node={
                    <EllipsisOutlined className=" hover:bg-textHover p-1 rounded" />
                }>
                <MenuItem
                    label="编辑"
                    onClick={() => {
                        setEditRoleId(data?.id)
                        setRoleModalOpen(true)
                    }}
                    icon={<EditOutlined></EditOutlined>}></MenuItem>
                <MenuItem
                    label="移除"
                    disabled={data?.system}
                    onClick={() => {
                        deleteMany.mutateAsync({
                            ids: [data?.id],
                        });
                    }}
                    icon={<DeleteOutlined></DeleteOutlined>}></MenuItem>
            </Menu>
        </div>
    );
};
export default function RoleList() {
    const { editRoleId, setEditRoleId, setRoleModalOpen } = useContext(RoleEditorContext)
    const { setRole, role } = useContext(RoleEditorContext)
    const { data: roles } = api.role.findMany.useQuery({})
    const { token } = theme.useToken()
    const { user, hasSomePermissions } = useAuth()
    const canManageAnyRole = useMemo(() => {
        return hasSomePermissions(RolePerms.MANAGE_ANY_ROLE)
    }, [user])
    const filterRoles = useMemo(() => {
        if (roles) {
            if (!canManageAnyRole)
                return roles.filter(role => role.name !== '根管理员')
            else
                return roles
        }
        return []
    }, [roles])
    useEffect(() => {
        if (!role && roles && roles.length > 0) {
            setRole?.(roles[0] as any)
        }
    }, [roles])
    return (
        <div className="w-1/6 border-r">
            <div className="p-2 border-b  justify-between items-center flex">
                <div className=" text-primary">角色列表</div>
                {canManageAnyRole && <Button onClick={() => {
                    setRoleModalOpen(true)
                }} type="primary" ghost icon={<PlusOutlined></PlusOutlined>}>添加角色</Button>}
            </div>
            <div className="flex flex-col ">
                {filterRoles?.map(item => <div
                    onClick={() => {
                        setRole(item as any)
                    }}
                    style={{
                        background: item.id === role?.id ? token.colorPrimaryBg : ""
                    }}
                    className={`p-2 hover:bg-textHover text-secondary ${item.id === role?.id ? " text-primary border-l-4 border-primaryHover" : ""} transition-all ease-in-out  flex items-center justify-between `}
                    key={item.id}>
                    <div className=" flex items-center gap-2">
                        <span className="text-primary"> <UserOutlined></UserOutlined></span>
                        {item.name}
                    </div>

                    {canManageAnyRole && <OpreationRenderer data={item as any}></OpreationRenderer>}
                </div>)}
            </div>
        </div>
    );
}