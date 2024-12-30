import { useRoleMap } from "@nicestack/client";
import { Button, message, Modal } from "antd";
import { useContext, useRef, useState } from "react";
import { RoleEditorContext } from "./role-editor";
import StaffTransfer, { StaffTransferRef } from "../../staff/staff-transfer";
import { ObjectType } from "@nicestack/common";
import { api } from "@nicestack/client"
export default function RoleStaffModal() {
    const {
        domainId,
        mapStaffIds,
        setMapStaffIds,
        modalOpen,
        setModalOpen,
        role
    } = useContext(RoleEditorContext);
    const staffsRef = useRef<StaffTransferRef>(null)
    const { data } = api.rolemap.getStaffsNotMap.useQuery({ domainId, roleId: role?.id });
    const { addRoleForObjects } = useRoleMap();
    const [loading, setLoading] = useState(false);
    const handleOk = async () => {
        if (!mapStaffIds?.length) {
            message.warning("未选择人员");
            return;
        }
        setLoading(true);
        try {
            const result = await addRoleForObjects.mutateAsync({
                roleId: role?.id,
                domainId,
                objectType: ObjectType.STAFF,
                objectIds: mapStaffIds
            });
            message.success("人员分配成功");
            setModalOpen(false);
            setMapStaffIds([]);
            if (staffsRef.current)
                staffsRef.current.resetSelection()
           
        } catch (error) {
            message.error("人员分配失败，请稍后重试");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => setModalOpen(false);

    return (
        <Modal
            width={600}
            title="选择人员"
            open={modalOpen}
            onOk={handleOk}
            confirmLoading={loading}
            onCancel={handleCancel}
        >
            <StaffTransfer ref={staffsRef}
                onChange={(values: string[]) => setMapStaffIds(values)}
                staffs={data as any}
            />
        </Modal>
    );
}
