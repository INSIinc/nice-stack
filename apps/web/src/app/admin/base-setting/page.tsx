import {
	AppConfigSlug,
	BaseSetting,
	RolePerms,
} from "@nicestack/common";
import { useContext, useEffect, useState } from "react";
import {
	Button,
	Form,
	Input,
	message,
	theme,
} from "antd";
import { useAppConfig } from "@nicestack/client";
import { useAuth } from "@web/src/providers/auth-provider";
import { MainLayoutContext } from "../../layout";
import FixedHeader from "@web/src/components/layout/fix-header";
import { useForm } from "antd/es/form/Form";
import { api } from "@nicestack/client"

export default function BaseSettingPage() {
	const { update, baseSetting } = useAppConfig();
	const utils = api.useUtils()
	const [form] = useForm()
	const { token } = theme.useToken();
	const { data: clientCount } = api.app_config.getClientCount.useQuery(undefined, {
		refetchInterval: 3000,
		refetchIntervalInBackground: true
	})
	const [isFormChanged, setIsFormChanged] = useState(false);
	const [loading, setLoading] = useState(false);
	const { user, hasSomePermissions } = useAuth();
	const { pageWidth } = useContext?.(MainLayoutContext);
	function handleFieldsChange() {
		setIsFormChanged(true);
	}
	function onResetClick() {
		if (!form)
			return
		if (!baseSetting) {
			form.resetFields();
		} else {
			form.resetFields();
			form.setFieldsValue(baseSetting);

		}
		setIsFormChanged(false);
	}
	function onSaveClick() {
		if (form)
			form.submit();
	}
	async function onSubmit(values: BaseSetting) {
		setLoading(true);

		try {

			await update.mutateAsync({
				where: {
					slug: AppConfigSlug.BASE_SETTING,
				},
				data: { meta: JSON.stringify(values) }
			});
			setIsFormChanged(false);
			message.success("已保存");
		} catch (err: any) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}
	useEffect(() => {
		if (baseSetting && form) {

			form.setFieldsValue(baseSetting);
		}
	}, [baseSetting, form]);
	return (
		<div style={{ width: pageWidth }}>
			<FixedHeader>
				<div className="flex items-center gap-2">
					{isFormChanged &&
						hasSomePermissions(RolePerms.MANAGE_BASE_SETTING) && (
							<>
								<Button onClick={onResetClick}>重置</Button>
								<Button
									loading={loading}
									type="primary"
									onClick={onSaveClick}>
									保存
								</Button>
							</>
						)}
				</div>
			</FixedHeader>
			<div
				className="flex flex-col  overflow-auto "
				style={{ height: "calc(100vh - 48px - 49px)" }}>
				<Form
					form={form}
					disabled={
						!hasSomePermissions(RolePerms.MANAGE_BASE_SETTING)
					}
					onFinish={onSubmit}

					onFieldsChange={handleFieldsChange}
					layout="vertical">
					{/* <div
						className="p-2 border-b"
						style={{
							fontSize: token.fontSize,
							fontWeight: "bold",
						}}>
						头像配置
					</div> */}
					<div
						className="p-2 border-b"
						style={{
							fontSize: token.fontSize,
							fontWeight: "bold",
						}}>
						全局参数配置
					</div>
					<div className="p-2 grid grid-cols-8 gap-2 border-b">
						<Form.Item
							label="运维单位"
							name={["appConfig", "devDept"]}>
							<Input></Input>
						</Form.Item>
					</div>
					{/* <div
						className="p-2 border-b flex items-center justify-between"
						style={{
							fontSize: token.fontSize,
							fontWeight: "bold",

						}}>
						登录页面配置
						<Button onClick={() => {
							form?.setFieldValue(["appConfig", "splashScreen"], undefined)
							setIsFormChanged(true)
						}}>重置</Button>
					</div>
					<div className="p-2 grid grid-cols-8 gap-2 border-b">
						<Form.Item
							label="首屏图片"
							name={["appConfig", "splashScreen"]}>
							<ImageUploader className="w-40" style={{ aspectRatio: "9/16" }} ></ImageUploader>
						</Form.Item>
					</div> */}
				</Form>
				<div
					className="p-2 border-b text-primary flex justify-between  items-center"
					style={{
						fontSize: token.fontSize,
						fontWeight: "bold",
					}}>
					<span>服务端全局命令</span>
				</div>
				<div className=" p-2 grid grid-cols-8 gap-4 border-b">
					<Button
						onClick={async () => {
							try {
								await utils.client.app_config.clearRowCache.mutate();
								message.success("操作成功"); // Displays a success message
							} catch (error) {
								message.error("操作失败，请重试"); // Displays an error message
							}
						}}
						type="primary"
						ghost>
						清除行模型缓存
					</Button>
				</div>
				{<div
					className="p-2 border-b text-primary flex justify-between  items-center"
					style={{
						fontSize: token.fontSize,
						fontWeight: "bold",
					}}>
					<span>app在线人数</span>
					<div>
						{clientCount && clientCount > 0 ? `${clientCount}人在线` : '无人在线'}
					</div>
				</div>}
			</div>
		</div>
	);
}
