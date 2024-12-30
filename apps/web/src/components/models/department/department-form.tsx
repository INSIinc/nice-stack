import { Spin, message, Input, InputNumber, Checkbox, Form } from "antd";
import { useDepartment, api } from "@nicestack/client";
import { Department, DepartmentDto, ObjectType, mapArrayToObjectArray } from "@nicestack/common";
import { useContext, useState, useEffect } from "react";
import TermSelect from "../term/term-select";
import DepartmentSelect from "./department-select";
import { DeptEditorContext } from "./dept-editor";

export default function DepartmentForm() {
	const { editId, form, parentId, setModalOpen, setEditId, setParentId } =
		useContext(DeptEditorContext);
	const { create, update } = useDepartment();
	const [loading, setLoading] = useState(false);
	const {
		data,
		isLoading: editDataIsLoading,
	}: { data: DepartmentDto; isLoading: boolean } =
		api.department.findFirst.useQuery(
			{ where: { id: editId }, include: { terms: true } },
			{ enabled: Boolean(editId) }
		);
	// useEffect(() => {
	// 	if (parentId) form?.setFieldValue("parentId", parentId);
	// 	taxonomies?.forEach((tax) => {
	// 		form.setFieldValue(
	// 			`taxonomies.${tax.name}`,
	// 			(data?.terms || [])
	// 				.filter((term) => term.taxonomyId === tax.id)
	// 				.map((term) => term.id)
	// 		);
	// 	});
	// }, [parentId]);
	const { data: taxonomies } = api.taxonomy.getAll.useQuery({
		type: ObjectType.DEPARTMENT,
	});
	useEffect(() => {
		if (editId && data && taxonomies) {
			form.setFieldsValue({
				...data,
				taxonomy: taxonomies.reduce((acc, tax) => {
					acc[tax.name] = (data?.terms || [])
						.filter((term) => term.taxonomyId === tax.id)
						.map((term) => term.id);
					return acc;
				}, {})
			});
		} else {
			form.resetFields()
		}
		if (parentId) form?.setFieldValue("parentId", parentId);
	}, [data, taxonomies, editId, parentId]);

	if (editDataIsLoading) {
		return (
			<div className="flex flex-col justify-center items-center">
				<Spin></Spin>
			</div>
		);
	}
	return (
		<Form
			initialValues={data}
			form={form}
			layout="vertical"
			requiredMark="optional"
			onFinish={async (values) => {
				setLoading(true);
				const { taxonomy, ...others } = values
				try {
					const termIds = taxonomies?.reduce((acc, taxonomy) => {
						const taxonomyTerms = taxonomy?.[taxonomy.name];
						if (taxonomyTerms) {
							if (Array.isArray(taxonomyTerms)) {
								acc.push(...taxonomyTerms);
							} else {
								acc.push(taxonomyTerms);
							}
						}
						return acc;
					}, [] as string[]);
					if (data) {
						await update.mutateAsync({
							where: { id: editId },
							data: {
								...others,
								terms: { set: mapArrayToObjectArray(termIds) }
							}
						});

					} else {
						await create.mutateAsync({
							data: {
								...others,
								terms: { connect: mapArrayToObjectArray(termIds) }
							}
						});
						form?.resetFields();
						if (parentId) form?.setFieldValue("parentId", parentId);
					}
					setLoading(false);
					message.success("提交成功");
					setModalOpen(false)
					setParentId(undefined)
					setEditId(undefined)
				} catch (e) {
					console.log(e);
					message.error('提交失败')
				} finally {
					setLoading(false);
				}
			}}>
			<Form.Item rules={[{ required: true }]} name={"name"} label="名称">
				<Input></Input>
			</Form.Item>
			<Form.Item name={"parentId"} label="父单位">
				<DepartmentSelect></DepartmentSelect>
			</Form.Item>
			{taxonomies?.map((tax) => {
				return (
					<Form.Item
						key={tax.id}
						label={tax.name}
						name={['taxonomy', tax.name]}>
						<TermSelect taxonomyId={tax.id}></TermSelect>
					</Form.Item>
				);
			})}
			<Form.Item name={"order"} label="顺序">
				<InputNumber></InputNumber>
			</Form.Item>
			<Form.Item name={"isDomain"} valuePropName="checked">
				<Checkbox>是否为域</Checkbox>
			</Form.Item>
		</Form>
	);
}
