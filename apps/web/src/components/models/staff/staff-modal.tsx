import { Button, Drawer, Modal } from "antd";
import React, { useContext, useEffect, useState } from "react";
import StaffForm from "./staff-form";
import { StaffEditorContext } from "./staff-editor";

export default function StaffModal() {
	const { editId, formLoading, modalOpen, setModalOpen, form, setEditId } = useContext(StaffEditorContext);
	const handleOk = () => {
		form.submit();

	};
	return (
		<Modal
			width={400}
			onOk={handleOk}
			open={modalOpen}
			confirmLoading={formLoading}
			onCancel={() => {
				setModalOpen(false);
				setEditId(undefined)
			}}
			title={editId ? "编辑用户" : "创建用户"}
		>
			<StaffForm />
		</Modal>
	);
}
