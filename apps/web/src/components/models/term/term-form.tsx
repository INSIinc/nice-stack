import { Button, Form, Input, message, Checkbox, Spin } from "antd";
import { useContext, useEffect, useRef, useState } from "react";
import { useTerm } from "@nicestack/client";
import TermSelect from "./term-select";
import { TermEditorContext } from "./term-editor";
import { api } from "@nicestack/client"
export default function TermForm() {
	const { termForm, setTermModalOpen, taxonomyId, domainId, editId, parentId, setEditId, setParentId } = useContext(TermEditorContext);
	const { create, update } = useTerm(); // Ensure you have these methods in your hooks
	const [loading, setLoading] = useState(false);
	const { data, isLoading } = api.term.findFirst.useQuery(
		{ where: { id: editId } },
		{ enabled: !!editId }
	);
	useEffect(() => {
		if (data) {
			termForm.setFieldValue("parentId", data?.parentId);
			termForm.setFieldValue("name", data?.name);
		} else {
			termForm.resetFields()
		}
		if (parentId) {
			termForm.setFieldValue("parentId", parentId);
		}
	}, [data, parentId]);
	return (
		<div className="relative">
			{isLoading && (
				<div className="absolute h-full inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
					<Spin />
				</div>
			)}
			<Form
				disabled={isLoading}
				form={termForm}
				layout="vertical"
				requiredMark="optional"
				onFinish={async (values) => {
					setLoading(true);
					try {
						if (data) {
							await update.mutateAsync({
								where: { id: data.id, },
								data: {
									taxonomyId,
									domainId,
									...values,
								}
							});
						} else {
							await create.mutateAsync({
								data: {
									domainId,
									taxonomyId,
									...values,
								}
							});
							termForm?.resetFields();
						}
						setTermModalOpen(false)
						setEditId(undefined)
						setParentId(undefined)
					} catch (err: any) {
						message.error("提交失败");
					} finally {
						setLoading(false);

					}


				}}>
				<Form.Item name={"parentId"} label="父分类">
					<TermSelect taxonomyId={taxonomyId}></TermSelect>
				</Form.Item>
				<Form.Item
					rules={[{ required: true }]}
					name={"name"}
					label="名称">
					<Input />
				</Form.Item>

			</Form>
		</div>
	);
}
