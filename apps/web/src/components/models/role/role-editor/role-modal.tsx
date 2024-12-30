import { Button, message, Modal } from "antd";
import { useContext, useRef, useState } from "react";
import { RoleEditorContext } from "./role-editor";
import RoleForm from "./role-form";

export default function RoleModal() {
    const {
        roleForm,
        editRoleId,
        roleModalOpen, setRoleModalOpen
    } = useContext(RoleEditorContext);

    const handleOk = async () => {
        roleForm.submit()
    };

    const handleCancel = () => setRoleModalOpen(false);

    return (
        <Modal
            width={500}
            title={editRoleId ? "编辑角色" : "创建角色"}
            open={roleModalOpen}
            onOk={handleOk}
            // confirmLoading={loading}
            onCancel={handleCancel}
        >
            <RoleForm></RoleForm>
        </Modal>
    );
}
