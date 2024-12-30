import { Form, Input, Select } from "antd";
import { useContext, useState } from "react";
import { ObjectType } from "@nicestack/common";
import { useTaxonomy } from "@nicestack/client";
import { TermEditorContext } from "./term-editor";
import { api } from "@nicestack/client"
export default function TaxonomyForm() {
	const { create, update } = useTaxonomy();
	const [loading, setLoading] = useState(false);
	const { taxonomyForm, setTaxonomyModalOpen, editTaxonomyId } = useContext(TermEditorContext)
	const { data, isLoading } = api.taxonomy.findById.useQuery(
		{ id: editTaxonomyId },
		{ enabled: !!editTaxonomyId }
	);
	return (
		<Form
			initialValues={data}
			form={taxonomyForm}
			layout="vertical"
			requiredMark="optional"
			onFinish={async (values) => {
				console.log(values);
				setLoading(true);
				if (data) {
					await update.mutateAsync({ id: data.id, ...values });
				} else {
					await create.mutateAsync(values);
					taxonomyForm.resetFields();
				}
				setLoading(false);
				setTaxonomyModalOpen(false)
			}}>
			<Form.Item
				rules={[{ required: true, message: "请输入名称" }]}
				name={"name"}
				label="名称">
				<Input></Input>
			</Form.Item>
			<Form.Item
				rules={[{ required: true, message: "请输入别名" }]}
				name={"slug"}
				label="别名">
				<Input></Input>
			</Form.Item>
			<Form.Item
				rules={[{ required: true, message: "选择作用对象类型" }]}
				name="objectType"
				label="对象类型">
				<Select mode="multiple" placeholder="选择作用对象类型">
					{Object.keys(ObjectType).map((key) => (
						<Select.Option key={key} value={ObjectType[key]}>
							{ObjectType[key]}
						</Select.Option>
					))}
				</Select>
			</Form.Item>

		</Form>
	);
}
