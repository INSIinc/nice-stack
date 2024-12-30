import { Avatar, Divider, Dropdown, theme } from "antd";
import { Icon } from "@nicestack/iconer";

import CollapsibleSection from "../presentation/collapse-section";
import { useAuth } from "@web/src/providers/auth-provider";
import { RolePerms } from "@nicestack/common";

export default function SidebarContent() {
	const { logout, user, isAuthenticated, hasSomePermissions } = useAuth();

	return (
		<div className="flex flex-col h-full">
			<div className="mt-12">
				<CollapsibleSection
					defaultExpandedKeys={["1", "2", "3"]}
					items={[
						// {
						// 	key: "home",
						// 	label: "首页",
						// 	icon: <Icon name={"home"}></Icon>,
						// 	link: "/",
						// },
						{
							key: "trouble",
							label: "问题列表",
							icon: <Icon name={"list"}></Icon>,
							link: "/troubles",
						},
						hasSomePermissions(
							RolePerms.MANAGE_ANY_DEPT,
							RolePerms.MANAGE_ANY_STAFF,
							RolePerms.MANAGE_ANY_ROLE,
							RolePerms.MANAGE_DOM_STAFF,
							RolePerms.MANAGE_BASE_SETTING
						) && {
							key: "4",
							label: "系统设置",
							icon: <Icon name="setting"></Icon>,
							children: [
								hasSomePermissions(
									RolePerms.MANAGE_BASE_SETTING
								) && {
									key: "4-0",
									icon: <Icon name="config"></Icon>,
									label: "参数配置",
									link: "/admin/base-setting",
								},

								hasSomePermissions(
									RolePerms.MANAGE_ANY_TERM,
									// RolePerms.MANAGE_DOM_TERM
								) && {
									key: "4-1",
									icon: <Icon name="category-outline"></Icon>,
									label: "分类配置",
									link: "/admin/term",
								},
								hasSomePermissions(
									RolePerms.MANAGE_ANY_DEPT
								) && {
									key: "4-5",
									icon: <Icon name="org"></Icon>,
									label: "组织架构",
									link: "/admin/department",
								},
								hasSomePermissions(
									RolePerms.MANAGE_ANY_STAFF,
									RolePerms.MANAGE_DOM_STAFF
								) && {
									key: "4-6",
									icon: <Icon name="people-group"></Icon>,
									label: "用户管理",
									link: "/admin/staff",
								},
								hasSomePermissions(
									RolePerms.MANAGE_ANY_ROLE,
									RolePerms.MANAGE_DOM_ROLE
								) && {
									key: "4-7",
									icon: <Icon name="admin-outlined"></Icon>,
									label: "角色管理",
									link: "/admin/role",
								},
							].filter(Boolean),
						},
					].filter(Boolean)}></CollapsibleSection>
			</div>
		</div>
	);
}
