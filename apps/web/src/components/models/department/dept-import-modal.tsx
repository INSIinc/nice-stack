import { useContext } from "react";
import { Modal } from "antd";

import { DeptEditorContext } from "./dept-editor";
import DeptImportForm from "./dept-import-form";
export default function DeptImportModal() {
	const { importModalOpen, setImportModalOpen } =
		useContext(DeptEditorContext);
	const handleOk = () => {
		// form.submit()
	};
	return (
		<Modal
			onOk={() => handleOk()}
			open={importModalOpen}
			onCancel={() => {
				setImportModalOpen(false);
			}}
			title={"导入单位"}
			width={600}
			footer={null}>
			<DeptImportForm></DeptImportForm>
		</Modal>
	);
}
