import {
    createBrowserRouter
} from "react-router-dom";
import MainPage from "../app/main/page";
import RootLayout from "./root-layout";
import ErrorPage from './error-page';
export const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout></RootLayout>,
        errorElement: <ErrorPage></ErrorPage>,
        children: [
            {
                index: true,
                element: <MainPage></MainPage>
            }
        ]
    },
]);
