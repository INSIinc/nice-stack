import { Button, Drawer, Form } from "antd";
import React, { useEffect, useRef, useState } from "react";
import type { ButtonProps, FormInstance } from "antd";
import { Term } from "@nicestack/common";
import DomainSelect from "../domain/domain-select";
import TaxonomySelect from "../taxonomy/taxonomy-select";
import TermSelect from "./term-select";
import { ExcelImporter } from "../../utilities/excel-importer";

interface TermDrawerProps extends ButtonProps {
	title: string;
	data?: Partial<Term>;
	parentId?: string;
	taxonomyId: string;
	domainId?: string;
}

export default function TermImportDrawer({
	data,
	parentId,
	title,
	taxonomyId,
	domainId,
	...buttonProps
}: TermDrawerProps) {
	const [open, setOpen] = useState(false);
	const handleTrigger = () => {
		setOpen(true);
	};

	const [termDomainId, setTermDomainId] = useState<string | undefined>(
		domainId
	);
	const [termTaxonomyId, setTermTaxonomyId] = useState<string | undefined>(
		taxonomyId
	);

	const [termId, setTermId] = useState<string | undefined>(parentId);
	const formRef = useRef<FormInstance>(null);
	useEffect(() => {
		if (parentId) {
			formRef.current?.setFieldValue("termId", taxonomyId);
			setTermId(parentId);
		}
	}, [parentId]);
	useEffect(() => {
		if (taxonomyId) {
			formRef.current?.setFieldValue("taxonomyId", taxonomyId);
			setTermTaxonomyId(taxonomyId);
		}
	}, [taxonomyId]);
	useEffect(() => {
		if (domainId) {
			formRef.current?.setFieldValue("domainId", domainId);
			setTermDomainId(domainId);
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
								setTermDomainId(value);
							}}></DomainSelect>
					</Form.Item>
					<Form.Item
						name={"taxonomyId"}
						initialValue={taxonomyId}
						label="所属分类"
						required>
						<TaxonomySelect
							onChange={(value) => {
								setTermTaxonomyId(value);
							}}></TaxonomySelect>
					</Form.Item>
					<Form.Item name={"termId"} label="所属父节点">
						<TermSelect
							onChange={(value) => {
								setTermId(value);
							}}
							taxonomyId={termTaxonomyId}></TermSelect>
					</Form.Item>
				</Form>
				<div className="flex justify-center">
					<ExcelImporter
						disabled={!termTaxonomyId}
						domainId={termDomainId}
						taxonomyId={termTaxonomyId}
						parentId={termId}
						type="term"></ExcelImporter>
				</div>
			</Drawer>
		</>
	);
}
