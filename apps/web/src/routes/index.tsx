import {
	createBrowserRouter,
	IndexRouteObject,
	Link,
	NonIndexRouteObject,
} from "react-router-dom";
import { RolePerms } from "@nicestack/common";
import ErrorPage from "../app/error";
import DepartmentAdminPage from "../app/admin/department/page";
import TermAdminPage from "../app/admin/term/page";
import StaffAdminPage from "../app/admin/staff/page";
import RoleAdminPage from "../app/admin/role/page";
import MainLayoutPage from "../app/layout";
import WithAuth from "../components/utils/with-auth";
import LoginPage from "../app/login";
import BaseSettingPage from "../app/admin/base-setting/page";
interface CustomIndexRouteObject extends IndexRouteObject {
	name?: string;
	breadcrumb?: string;
}
interface CustomIndexRouteObject extends IndexRouteObject {
	name?: string;
	breadcrumb?: string;
}

export interface CustomNonIndexRouteObject extends NonIndexRouteObject {
	name?: string;
	children?: CustomRouteObject[];
	breadcrumb?: string;
	handle?: {
		crumb: (data?: any) => void;
	};
}
export type CustomRouteObject =
	| CustomIndexRouteObject
	| CustomNonIndexRouteObject;
export const routes: CustomRouteObject[] = [
	{
		path: "/",
		element: <MainLayoutPage></MainLayoutPage>,
		errorElement: <ErrorPage />,
		handle: {
			crumb() {
				return <Link to={"/"}>主页</Link>;
			},
		},
		children: [
			{
				path: "admin",
				children: [
					{
						path: "base-setting",
						element: (
							<WithAuth
								options={{
									orPermissions: [
										RolePerms.MANAGE_BASE_SETTING,
									],
								}}>
								<BaseSettingPage></BaseSettingPage>
							</WithAuth>
						),
						handle: {
							crumb() {
								return (
									<Link to={"/admin/base-setting"}>
										基本设置
									</Link>
								);
							},
						},
					},
					{
						path: "department",
						breadcrumb: "单位管理",
						element: (
							<WithAuth
								options={{
									orPermissions: [RolePerms.MANAGE_ANY_DEPT],
								}}>
								<DepartmentAdminPage></DepartmentAdminPage>
							</WithAuth>
						),
						handle: {
							crumb() {
								return (
									<Link to={"/admin/department"}>
										组织架构
									</Link>
								);
							},
						},
					},
					{
						path: "staff",
						element: (
							<WithAuth
								options={{
									orPermissions: [
										RolePerms.MANAGE_ANY_STAFF,
										RolePerms.MANAGE_DOM_STAFF,
									],
								}}>
								<StaffAdminPage></StaffAdminPage>
							</WithAuth>
						),
						handle: {
							crumb() {
								return (
									<Link to={"/admin/staff"}>用户管理</Link>
								);
							},
						},
					},
					{
						path: "term",
						breadcrumb: "分类配置",
						element: (
							<WithAuth
								options={{
									orPermissions: [
										RolePerms.MANAGE_ANY_TERM,
										// RolePerms.MANAGE_DOM_TERM
									],
								}}>
								<TermAdminPage></TermAdminPage>
							</WithAuth>
						),
						handle: {
							crumb() {
								return <Link to={"/admin/term"}>分类配置</Link>;
							},
						},
					},
					{
						path: "role",
						breadcrumb: "角色管理",
						element: (
							<WithAuth
								options={{
									orPermissions: [
										RolePerms.MANAGE_ANY_ROLE,
										RolePerms.MANAGE_DOM_ROLE,
									],
								}}>
								<RoleAdminPage></RoleAdminPage>
							</WithAuth>
						),
						handle: {
							crumb() {
								return <Link to={"/admin/role"}>角色管理</Link>;
							},
						},
					},
				],
			},
		],
	},
	{
		path: "/login",
		breadcrumb: "登录",
		element: <LoginPage></LoginPage>,
	},
];

export const router = createBrowserRouter(routes);
