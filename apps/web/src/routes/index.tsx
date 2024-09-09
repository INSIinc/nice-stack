import {
    createBrowserRouter
} from "react-router-dom";
import MainPage from "../app/main/page";
import ErrorPage from "../app/error";
import LayoutPage from "../app/layout";
import LoginPage from "../app/login";
import WithAuth from "../components/auth/with-auth";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <LayoutPage></LayoutPage>,
        errorElement: <ErrorPage></ErrorPage>,
        children: [
            {
                index: true,
                element: <WithAuth><MainPage></MainPage></WithAuth>
            }
        ],
    },
    {
        path: '/login',
        element: <LoginPage></LoginPage>
    }

]);
