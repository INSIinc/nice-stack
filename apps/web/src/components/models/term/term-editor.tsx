import { createContext, useMemo, useState } from "react";
import { useAuth } from "@web/src/providers/auth-provider";
import { RolePerms } from "@nicestack/common";
import TaxonomyModal from "./taxonomy-modal";
import TaxonomyList from "./taxonomy-list";
import TermList from "./term-list";
import { FormInstance } from "antd";
import { useForm } from "antd/es/form/Form";
import TermModal from "./term-modal";
import TermImportModal from "./term-import-modal";
// 扩展上下文类型以包括 mapStaffIds 和 setMapStaffIds
export const TermEditorContext = createContext<{
	taxonomyId: string;
	taxonomyName: string;
	domainId: string;
	parentId: string;
	taxonomyModalOpen: boolean;
	termModalOpen: boolean;
	setTaxonomyId: React.Dispatch<React.SetStateAction<string>>;
	setTaxonomyName: React.Dispatch<React.SetStateAction<string>>;
	setDomainId: React.Dispatch<React.SetStateAction<string>>;
	setParentId: React.Dispatch<React.SetStateAction<string>>;
	setTaxonomyModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setTermModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	canManageAnyTerm: boolean;
	editId: string;
	setEditId: React.Dispatch<React.SetStateAction<string>>;
	editTaxonomyId: string;
	setEditTaxonomyId: React.Dispatch<React.SetStateAction<string>>;
	termForm: FormInstance<any>;
	taxonomyForm: FormInstance<any>;
	canManageTerm: boolean;
	importModalOpen: boolean;
	setImportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>(undefined);

export default function TermEditor() {
	const [taxonomyId, setTaxonomyId] = useState<string>();
	const [taxonomyName, setTaxonomyName] = useState<string>();
	const [domainId, setDomainId] = useState<string>();
	const [taxonomyModalOpen, setTaxonomyModalOpen] = useState<boolean>(false);
	const [termModalOpen, setTermModalOpen] = useState<boolean>(false);
	const [importModalOpen, setImportModalOpen] = useState(false);
	const { user, hasSomePermissions } = useAuth();
	const [editId, setEditId] = useState<string>();
	const [editTaxonomyId, setEditTaxonomyId] = useState<string>();
	const [parentId, setParentId] = useState<string>();
	const [termForm] = useForm();
	const [taxonomyForm] = useForm();
	const canManageTerm = useMemo(() => {
		return hasSomePermissions(
			RolePerms.MANAGE_ANY_TERM,
			RolePerms.MANAGE_DOM_TERM
		);
	}, [user]);
	const canManageAnyTerm = useMemo(() => {
		return hasSomePermissions(RolePerms.MANAGE_ANY_TERM);
	}, [user]);
	return (
		<TermEditorContext.Provider
			value={{
				parentId,
				setParentId,
				canManageAnyTerm,
				canManageTerm,
				taxonomyId,
				taxonomyName,
				domainId,
				taxonomyModalOpen,
				termModalOpen,
				setTaxonomyId,
				setTaxonomyName,
				setDomainId,
				setTaxonomyModalOpen,
				setTermModalOpen,
				termForm,
				editId,
				setEditId,
				taxonomyForm,
				editTaxonomyId,
				setEditTaxonomyId,
				setImportModalOpen,
				importModalOpen,
			}}>
			<div className="flex">
				<TaxonomyList />
				<TermList></TermList>
			</div>
			<TaxonomyModal />
			<TermModal />
			<TermImportModal />
		</TermEditorContext.Provider>
	);
}
