
import RoleList from "@web/src/components/models/role/role-list";
import RoleMapTable from "@web/src/components/models/role/role-map-table";
import { Divider, Empty } from "antd";
import { useState } from "react";
export default function RoleAdminPage() {
	const [roleId, setRoleId] = useState<string | undefined>(undefined);
	const [roleName, setRoleName] = useState<string | undefined>(undefined);
	return (
		<div className="flex-grow p-2 bg-white rounded-xl flex">
			<div className="w-1/4">
				<RoleList
					onChange={(id, name) => {
						console.log(id);
						setRoleId(id);
						setRoleName(name);
					}}></RoleList>
			</div>
			<Divider className="h-full" type="vertical"></Divider>
			<div className="flex-1">
				{roleId && (
					<RoleMapTable
						roleName={roleName}
						roleId={roleId}></RoleMapTable>
				)}
				{!roleId && <Empty description="暂无角色"></Empty>}
			</div>
		</div>
	);
}
