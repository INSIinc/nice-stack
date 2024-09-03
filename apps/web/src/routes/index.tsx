import {
    createBrowserRouter
} from "react-router-dom";
import MainPage from "../app/main/page";
import ErrorPage from "../app/error";
import LayoutPage from "../app/layout";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <LayoutPage></LayoutPage>,
        errorElement: <ErrorPage></ErrorPage>,
        children: [
            {
                index: true,
                element: <MainPage></MainPage>
            }
        ]
    },
]);
