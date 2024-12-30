import { IdcardOutlined } from "@ant-design/icons";
import React from "react";

interface IdCardProps extends React.HTMLProps<HTMLDivElement> {
    id: string;
}

export default function IdCard({ id, ...rest }: IdCardProps) {
    return (
        <div
            className="flex  items-center"
            style={{ maxWidth: 150 }}
            {...rest}
        >
            {id ? (
                <div className="w-full truncate text-ellipsis flex  items-center gap-2   text-secondary">
                    <IdcardOutlined className="text-primary" />
                    <span className="text-ellipsis truncate">{id}</span>
                </div>
            ) : (
                <span className="text-tertiary">未录入证件号</span>
            )}
        </div>
    );
}
