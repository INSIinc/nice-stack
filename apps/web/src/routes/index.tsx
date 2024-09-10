import {
    createBrowserRouter,
    IndexRouteObject,
    NonIndexRouteObject
} from "react-router-dom";
import MainPage from "../app/main/page";
import ErrorPage from "../app/error";
import LayoutPage from "../app/layout";
import LoginPage from "../app/login";
import DepartmentAdminPage from "../app/admin/department/page";
import RoleAdminPage from "../app/admin/role/page";
import StaffAdminPage from "../app/admin/staff/page";
import TermAdminPage from "../app/admin/term/page";
import WithAuth from "../components/utilities/with-auth";
interface CustomIndexRouteObject extends IndexRouteObject {
    name?: string;
    breadcrumb?: string;
}

interface CustomNonIndexRouteObject extends NonIndexRouteObject {
    name?: string;
    children?: CustomRouteObject[];
    breadcrumb?: string;
}
type CustomRouteObject = CustomIndexRouteObject | CustomNonIndexRouteObject;
export const routes = [
    {
        path: "/",
        element: <LayoutPage></LayoutPage>,
        errorElement: <ErrorPage></ErrorPage>,
        children: [
            {
                index: true,
                element: <WithAuth><MainPage></MainPage></WithAuth>
            },
            {
                path: "admin",
                children: [
                    {
                        path: "department",
                        breadcrumb: "单位管理",
                        element: (
                            <WithAuth>
                                <DepartmentAdminPage></DepartmentAdminPage>
                            </WithAuth>
                        ),
                    },
                    {
                        path: "staff",
                        breadcrumb: "人员管理",
                        element: (
                            <WithAuth>
                                <StaffAdminPage></StaffAdminPage>
                            </WithAuth>
                        ),
                    },
                    {
                        path: "term",
                        breadcrumb: "术语管理",
                        element: (
                            <WithAuth>
                                <TermAdminPage></TermAdminPage>
                            </WithAuth>
                        ),
                    },

                    {
                        path: "role",
                        breadcrumb: "角色管理",
                        element: (
                            <WithAuth>
                                <RoleAdminPage></RoleAdminPage>
                            </WithAuth>
                        ),
                    }
                ],
            },
        ],
    },
    {
        path: '/login',
        element: <LoginPage></LoginPage>
    }

]
export const router = createBrowserRouter(routes);
