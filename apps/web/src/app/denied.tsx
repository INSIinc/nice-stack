import { Empty } from "antd";

export default function DeniedPage() {
    return <div className="pt-48 flex justify-center  items-center text-tertiary">
        <Empty description='您无权访问此页面'></Empty>
    </div>
}