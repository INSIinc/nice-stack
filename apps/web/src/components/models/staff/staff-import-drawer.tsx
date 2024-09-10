import { Button, Drawer, Form } from "antd";
import React, { useEffect, useRef, useState } from "react";
import type { ButtonProps, FormInstance } from "antd";
import { Term } from "@nicestack/common";
import DomainSelect from "../domain/domain-select";
import { ExcelImporter } from "../../utilities/excel-importer";


interface TermDrawerProps extends ButtonProps {
	title: string;
	data?: Partial<Term>;
	parentId?: string;

	domainId?: string;
}

export default function StaffImportDrawer({
	data,

	title,

	domainId,
	...buttonProps
}: TermDrawerProps) {
	const [open, setOpen] = useState(false);
	const handleTrigger = () => {
		setOpen(true);
	};

	const [staffDomainId, setStaffDomainId] = useState<string | undefined>(
		domainId
	);

	const formRef = useRef<FormInstance>(null);
	useEffect(() => {
		if (domainId) {
			formRef.current?.setFieldValue("domainId", domainId);
			setStaffDomainId(domainId);
		}
	}, [domainId]);
	return (
		<>
			<Button ghost {...buttonProps} onClick={handleTrigger}>
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
						name={"domainId"}
						initialValue={domainId}
						label="所属域">
						<DomainSelect
							onChange={(value) => {
								setStaffDomainId(value);
							}}></DomainSelect>
					</Form.Item>
				</Form>
				<div className="flex justify-center">
					<ExcelImporter
						disabled={!staffDomainId}
						domainId={staffDomainId}
						type="staff"></ExcelImporter>
				</div>
			</Drawer>
		</>
	);
}
