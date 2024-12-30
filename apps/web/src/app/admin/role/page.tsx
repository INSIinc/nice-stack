import FixedHeader from "@web/src/components/layout/fix-header";
import RoleEditor from "@web/src/components/models/role/role-editor/role-editor";

export default function RoleAdminPage() {
	return (
		<>
			<FixedHeader roomId="role-editor">
			</FixedHeader>
			<RoleEditor></RoleEditor>
		</>

	);
}
