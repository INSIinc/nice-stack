import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
    const error: any = useRouteError();
    return <div className=" flex justify-center items-center  pt-64 ">
        <div className=" flex  flex-col gap-4">
            <div className=" text-xl font-bold  text-primary">哦?页面似乎出错了...</div>
            <div className=" text-tertiary" >{error?.statusText || error?.message}</div>
        </div>
    </div>
}