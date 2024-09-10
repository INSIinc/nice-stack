import { Button, Drawer, Form } from "antd";
import React, { useRef, useState } from "react";
import type { ButtonProps, FormInstance } from "antd";
import { Department } from "@nicestack/common";
import { ExcelImporter } from "../../utilities/excel-importer";
import DepartmentSelect from "./department-select";


interface DepartmentDrawerProps extends ButtonProps {
	title: string;
	data?: Partial<Department>;
	parentId?: string;
}

export default function DepartmentImportDrawer({
	data,
	parentId,
	title,
	...buttonProps
}: DepartmentDrawerProps) {
	const [open, setOpen] = useState(false);
	const [deptParentId, setDeptParentId] = useState<string | undefined>(
		parentId ? parentId : undefined
	);
	const formRef = useRef<FormInstance>(null);
	const handleTrigger = () => {
		setOpen(true);
	};

	return (
		<>
			<Button {...buttonProps} onClick={handleTrigger}>
				{title}
			</Button>
			<Drawer
				open={open}
				onClose={() => {
					setOpen(false);
				}}
				title={title}
				width={400}>
				<Form ref={formRef} layout="vertical" requiredMark="optional">
					<Form.Item
						name={"parentId"}
						initialValue={parentId}
						label="所属父单位">
						<DepartmentSelect
							placeholder="选择父单位"
							rootId={parentId}
							onChange={(value) =>
								setDeptParentId(value as string)
							}></DepartmentSelect>
					</Form.Item>
					<div className="flex justify-center">
						<ExcelImporter
							type="dept"
							parentId={deptParentId}></ExcelImporter>
					</div>
				</Form>
			</Drawer>
		</>
	);
}
