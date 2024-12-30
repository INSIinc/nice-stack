import { useContext } from "react";

import { Modal } from "antd";
import TermImportForm from "./term-import-form";
import { TermEditorContext } from "./term-editor";
export default function TermImportModal() {
	const { importModalOpen, setImportModalOpen ,taxonomyName} =
		useContext(TermEditorContext);
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
			title={`导入${taxonomyName}`}
			width={600}
			footer={null}>
			<TermImportForm></TermImportForm>
		</Modal>
	);
}
