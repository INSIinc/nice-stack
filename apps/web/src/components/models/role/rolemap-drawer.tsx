import { Button, Drawer } from "antd";
import React, { useState } from "react";
import type { ButtonProps } from "antd";
import RoleMapForm from "./rolemap-form";

interface RoleMapDrawerProps extends ButtonProps {
	title: string;
	roleId: string;
	domainId?: string;
	roleType?: "dept" | "staff" | "both";
}

export default function RoleMapDrawer({
	roleId,
	title,
	domainId,
	roleType = "both",
	...buttonProps
}: RoleMapDrawerProps) {
	const [open, setOpen] = useState(false);
	const handleTrigger = () => {
		setOpen(true);
	};

	return (
		<>
			<Button type="primary" {...buttonProps} onClick={handleTrigger}>
				{title}
			</Button>
			<Drawer
				open={open}
				onClose={() => {
					setOpen(false);
				}}
				title={title}
				width={400}>
				<RoleMapForm roleType={roleType} roleId={roleId} domainId={domainId}></RoleMapForm>
			</Drawer>
		</>
	);
}
