import { IdcardOutlined, PhoneOutlined } from "@ant-design/icons";
import React from "react";

interface PhoneBookProps extends React.HTMLProps<HTMLDivElement> {
	phoneNumber: string;
}

export default function PhoneBook({ phoneNumber, ...rest }: PhoneBookProps) {
	return (
		<div className="flex  items-center" style={{ maxWidth: 150 }} {...rest}>
			{phoneNumber ? (
				<div className="w-full truncate text-ellipsis flex  items-center gap-2   text-secondary">
					<PhoneOutlined className="text-primary" />
					<span className="text-ellipsis truncate">
						{phoneNumber}
					</span>
				</div>
			) : (
				<span className="text-tertiary">未录入手机号</span>
			)}
		</div>
	);
}
