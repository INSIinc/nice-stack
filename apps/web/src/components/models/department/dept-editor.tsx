import { createContext, useMemo, useState } from "react";
import { useAuth } from "@web/src/providers/auth-provider";
import { RolePerms } from "@nicestack/common";

import { Button, FormInstance } from "antd";
import { useForm } from "antd/es/form/Form";
import DepartmentList from "./department-list";
import DeptModal from "./dept-modal";
import DeptImportModal from "./dept-import-modal";
import FixedHeader from "../../layout/fix-header";
export const DeptEditorContext = createContext<{
	parentId: string;
	domainId: string;
	modalOpen: boolean;
	setParentId: React.Dispatch<React.SetStateAction<string>>;
	setDomainId: React.Dispatch<React.SetStateAction<string>>;
	setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

	editId: string;
	setEditId: React.Dispatch<React.SetStateAction<string>>;
	form: FormInstance<any>;
	canManageDept: boolean;
	importModalOpen: boolean;
	setImportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>(undefined);

export default function DeptEditor() {
	const [parentId, setParentId] = useState<string>();
	const [domainId, setDomainId] = useState<string>();
	const [modalOpen, setModalOpen] = useState<boolean>(false);
	const [importModalOpen, setImportModalOpen] = useState(false);
	const { user, hasSomePermissions } = useAuth();
	const [editId, setEditId] = useState<string>();
	const [form] = useForm();
	const canManageDept = useMemo(() => {
		return hasSomePermissions(
			RolePerms.MANAGE_ANY_DEPT,
			RolePerms.MANAGE_DOM_DEPT
		);
	}, [user]);

	return (
		<DeptEditorContext.Provider
			value={{
				canManageDept,
				parentId,
				domainId,

				modalOpen,
				setParentId,
				setDomainId,

				setModalOpen,
				form,
				editId,
				setEditId,

				setImportModalOpen,
				importModalOpen,
			}}>
			<FixedHeader roomId="dept-editor">
				<div className=" flex items-center  gap-4 ">
					{canManageDept && (
						<>
							<Button
								ghost
								type="primary"
								onClick={() => {
									setImportModalOpen(true);
								}}>
								导入单位
							</Button>
							<Button
								type="primary"
								onClick={() => {
									setModalOpen(true);
								}}>
								新建单位
							</Button>
						</>
					)}
				</div>

			</FixedHeader>
			<DepartmentList></DepartmentList>
			<DeptModal />
			<DeptImportModal />
		</DeptEditorContext.Provider>
	);
}
