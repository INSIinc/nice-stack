import { Button, Form, Input, Spin, Switch, message } from "antd";
import { useContext, useEffect} from "react";
import { useStaff } from "@nicestack/client";
import DepartmentSelect from "../department/department-select";
import { api } from "@nicestack/client"
import { StaffEditorContext } from "./staff-editor";
import { useAuth } from "@web/src/providers/auth-provider";
export default function StaffForm() {
	const { create, update } = useStaff(); // Ensure you have these methods in your hooks
	const {
		domainId,
		form,
		editId,
		setModalOpen,
		formLoading,
		setFormLoading,
		canManageAnyStaff,
		setEditId,
	} = useContext(StaffEditorContext);
	const { data, isLoading } = api.staff.findFirst.useQuery(
		{ where: { id: editId } },
		{ enabled: !!editId }
	);
	const { isRoot } = useAuth();
	async function handleFinish(values: any) {
		const {
			username,
			showname,
			deptId,
			domainId: fieldDomainId,
			password,
			phoneNumber,
			officerId,
			enabled
		} = values
		setFormLoading(true);
		try {
			if (data && editId) {
				await update.mutateAsync({
					where: { id: data.id },
					data: {
						username,
						deptId,
						showname,
						domainId: fieldDomainId ? fieldDomainId : domainId,
						password,
						phoneNumber,
						officerId,
						enabled
					}
				});
			} else {
				await create.mutateAsync({
					data: {
						username,
						deptId,
						showname,
						domainId: fieldDomainId ? fieldDomainId : domainId,
						password,
						officerId,
						phoneNumber
					}
				});
				form.resetFields();
				if (deptId) form.setFieldValue("deptId", deptId);
				if (domainId) form.setFieldValue("domainId", domainId);
			}
			message.success("提交成功");
			setModalOpen(false);
		} catch (err: any) {
			message.error(err.message);
		} finally {
			setFormLoading(false);
			setEditId(undefined);
		}
	}
	useEffect(() => {
		form.resetFields();
		if (data && editId) {
			form.setFieldValue("username", data.username);
			form.setFieldValue("showname", data.showname);
			form.setFieldValue("domainId", data.domainId);
			form.setFieldValue("deptId", data.deptId);
			form.setFieldValue("officerId", data.officerId);
			form.setFieldValue("phoneNumber", data.phoneNumber);
			form.setFieldValue("enabled", data.enabled)
		}
	}, [data]);
	useEffect(() => {
		if (!data && domainId) {
			form.setFieldValue("domainId", domainId);
			form.setFieldValue("deptId", domainId);
		}
	}, [domainId, data]);
	return (
		<div className="relative">
			{isLoading && (
				<div className="absolute h-full inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
					<Spin />
				</div>
			)}
			<Form
				disabled={isLoading}
				form={form}
				layout="vertical"
				requiredMark="optional"
				autoComplete="off"
				onFinish={handleFinish}>
				{canManageAnyStaff && (
					<Form.Item
						name={"domainId"}
						label="所属域"
						rules={[{ required: true }]}>
						<DepartmentSelect
							rootId={isRoot ? undefined : domainId}
							domain={true}
						/>
					</Form.Item>
				)}
				<Form.Item
					name={"deptId"}
					label="所属单位"
					rules={[{ required: true }]}>
					<DepartmentSelect rootId={isRoot ? undefined : domainId} />
				</Form.Item>
				<Form.Item
					rules={[{ required: true }]}
					name={"username"}
					label="帐号">
					<Input allowClear
						autoComplete="new-username" // 使用非标准的自动完成值
						spellCheck={false}
					/>
				</Form.Item>
				<Form.Item
					rules={[{ required: true }]}
					name={"showname"}
					label="姓名">
					<Input allowClear
						autoComplete="new-name" // 使用非标准的自动完成值
						spellCheck={false}
					/>
				</Form.Item>
				<Form.Item
					rules={[
						{
							required: false,
							pattern: /^\d{5,18}$/,
							message: "请输入正确的证件号（数字）"
						}
					]}
					name={"officerId"}
					label="证件号">
					<Input autoComplete="off" spellCheck={false} allowClear />
				</Form.Item>
				<Form.Item
					rules={[
						{
							required: false,
							pattern: /^\d{6,11}$/,
							message: "请输入正确的手机号（数字）"
						}
					]}
					name={"phoneNumber"}
					label="手机号">
					<Input autoComplete="new-phone" // 使用非标准的自动完成值
						spellCheck={false} allowClear />
				</Form.Item>
				<Form.Item label="密码" name={"password"}>
					<Input.Password spellCheck={false} visibilityToggle autoComplete="new-password" />
				</Form.Item>
				{editId && <Form.Item label="是否启用" name={"enabled"}>
					<Switch></Switch>
				</Form.Item>}
			</Form>
		</div>
	);
}
