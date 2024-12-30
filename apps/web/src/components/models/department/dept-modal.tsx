import { useContext } from "react";
// import { TroubleEditorContext } from "./trouble-editor";
import { Modal } from "antd";

import { DeptEditorContext } from "./dept-editor";
import DepartmentForm from "./department-form";
export default function DeptModal() {
	const { editId, form, setEditId, modalOpen, setModalOpen } =
		useContext(DeptEditorContext);
	const handleOk = () => {
		form.submit();
	};
	return (
		<Modal
			onOk={() => handleOk()}
			open={modalOpen}
			onCancel={() => {
				setModalOpen(false);
				setEditId(undefined);
			}}
			title={editId ? "编辑单位" : "创建单位"}
			width={600}>
			<DepartmentForm></DepartmentForm>
		</Modal>
	);
}
