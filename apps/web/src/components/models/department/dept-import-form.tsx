import {
	DatePicker,
	Form,
	Input,
	Radio,
	Row,
	Col,
	Select,
	message,
	Button,
} from "antd";
import { useContext, useState, useEffect, useCallback } from "react";
import DepartmentSelect from "../department/department-select";


import { useAuth } from "@web/src/providers/auth-provider";
import { useTransform } from "@nicestack/client";
import ExcelToBase64Uploader from "../../presentation/excel-to-base64-uploader";
import { DeptEditorContext } from "./dept-editor";

export default function DeptImportForm() {
	const { importDepts } = useTransform();
	const { user } = useAuth();
	const { parentId, setParentId, canManageDept, domainId, setDomainId } =
		useContext(DeptEditorContext);
	const [base64, setBase64] = useState<string>(undefined);

	// Reset fields when type changes
	const handleImport = async () => {
		if (!base64) {
			message.warning("请先上传一个文件");
		} else {
			// 在这里处理导入逻辑
			console.log("导入的 Base64:", base64);
			try {
				message.info("正在导入...");
				await importDepts.mutateAsync({
					base64,
					parentId,
					domainId,
				});
				message.success("导入完成");
			} catch (err:any) {
				message.error(err.message);
			}
		}
	};
	return (
		<>
			<div className="flex flex-col items-stretch">
				<ExcelToBase64Uploader
					onBase64={(base64) => {
						setBase64(base64);
					}}
				/>
				<div className="flex gap-2 justify-end mt-4 items-center">
					<span className="text-sm">所属域:</span>

					<DepartmentSelect
						rootId={user?.domainId}
						onChange={(value) => setDomainId(value as string)}
						disabled={!canManageDept}
						domain
						value={domainId}
						className="w-32"></DepartmentSelect>
					<span className="text-sm">所属单位:</span>
					<DepartmentSelect
						rootId={user?.domainId}
						onChange={(value) => setParentId(value as string)}
						disabled={!canManageDept}
						value={parentId}
						className="w-32"></DepartmentSelect>
					<Button type="primary" onClick={handleImport}>
						导入
					</Button>
				</div>
			</div>
		</>
	);
}
