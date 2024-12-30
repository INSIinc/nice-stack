import React, { useState, useRef, useEffect } from "react";
import { Form, Input, Button, message, Row, Col } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/auth-provider";
import DepartmentSelect from "../components/models/department/department-select";
import SineWave from "../components/animation/sine-wave";
const LoginPage: React.FC = () => {
	const [showLogin, setShowLogin] = useState(true);
	const [registerLoading, setRegisterLoading] = useState(false);
	const {
		login,
		isAuthenticated,
		signup
	} = useAuth()
	const loginFormRef = useRef<any>(null);
	const registerFormRef = useRef<any>(null);
	const location = useLocation();
	const navigate = useNavigate();
	const onFinishLogin = async (values: any) => {
		try {
			const { username, password } = values;
			await login(username, password);
		} catch (err: any) {
			message.error(err?.response?.data?.message || "帐号或密码错误！");
			console.error(err);
		}
	};

	const onFinishRegister = async (values: any) => {
		setRegisterLoading(true);
		const { username, password, deptId, officerId, showname } = values;
		try {
			await signup({ username, password, deptId, officerId, showname });
			message.success("注册成功！");
			setShowLogin(true);
			// loginFormRef.current.submit();
		} catch (err: any) {
			message.error(err?.response?.data?.message);
		} finally {
			setRegisterLoading(false);
		}
	};

	useEffect(() => {
		if (isAuthenticated) {
			const params = new URLSearchParams(location.search);
			const redirectUrl = params.get("redirect_url") || "/";
			navigate(redirectUrl, { replace: true });
		}
	}, [isAuthenticated, location]);

	return (
		<div
			className="flex justify-center items-center h-screen w-full  bg-gray-200"
			style={{
				// backgroundImage: `url(${backgroundUrl})`,
				// backgroundSize: "cover",
			}}>
			<div
				className="flex items-center transition-all hover:bg-white overflow-hidden  border-2 border-white bg-gray-50 shadow-elegant rounded-xl "
				style={{ width: 800, height: 600 }}>
				<div
					className={`transition-all h-full flex-1 text-white p-10 flex items-center justify-center bg-primary`}>
					{showLogin ? (
						<div className="flex flex-col">
							<SineWave width={300} height={200} />
							<div className="text-2xl my-4">没有账号？</div>
							<div className="my-4 font-thin text-sm">
								点击注册一个属于你自己的账号吧！
							</div>
							<div
								onClick={() => setShowLogin(false)}
								className="hover:translate-y-1 my-8 p-2 text-center rounded-xl border-white border hover:bg-white hover:text-primary hover:shadow-xl hover:cursor-pointer transition-all">
								注册
							</div>
						</div>
					) : (
						<div className="flex flex-col">
							<div className="text-2xl my-4">注册小贴士</div>
							<div className="my-4 font-thin text-sm">
								请认真填写用户信息哦！
							</div>
							<div
								onClick={() => setShowLogin(true)}
								className="hover:translate-y-1 my-8 rounded-xl text-center border-white border p-2 hover:bg-white hover:text-primary hover:shadow-xl hover:cursor-pointer transition-all">
								返回登录
							</div>
							<SineWave width={300} height={200} />
						</div>
					)}
				</div>
				<div className="flex-1 py-10 px-10">
					{showLogin ? (
						<>
							<div className="text-center text-2xl text-primary select-none">
								<span className="px-2">登录</span>
							</div>
							<Form
								ref={loginFormRef}
								onFinish={onFinishLogin}
								layout="vertical"
								requiredMark="optional"
								size="large">
								<Form.Item
									name="username"
									label="帐号"
									rules={[
										{
											required: true,
											message: "请输入帐号",
										},
									]}>
									<Input />
								</Form.Item>

								<Form.Item
									name="password"
									label="密码"
									rules={[
										{
											required: true,
											message: "请输入密码",
										},
									]}>
									<Input.Password />
								</Form.Item>
								<div className="flex items-center justify-center">
									<Button type="primary" htmlType="submit">
										登录
									</Button>
								</div>
							</Form>
						</>
					) : (
						<div>
							<div className="text-center text-2xl text-primary">
								注册
							</div>
							<Form
								requiredMark="optional"
								ref={registerFormRef}
								onFinish={onFinishRegister}
								layout="vertical"
								size="large">
								<Form.Item
									name="deptId"
									label="所属单位"
									rules={[
										{
											required: true,
											message: "请选择单位",
										},
									]}>
									<DepartmentSelect
										domain={true}></DepartmentSelect>
								</Form.Item>
								<Row gutter={8}>
									<Col span={12}>
										<Form.Item
											name="username"
											label="帐号"
											rules={[
												{
													required: true,
													message: "请输入帐号",
												},
												{
													min: 2,
													max: 15,
													message:
														"帐号长度为 2 到 15 个字符",
												},
											]}>
											<Input />
										</Form.Item>
									</Col>
									<Col span={12}>
										<Form.Item
											name="showname"
											label="姓名"
											rules={[
												{
													required: true,
													message: "请输入姓名",
												},
												{
													min: 2,
													max: 15,
													message:
														"姓名长度为 2 到 15 个字符",
												},
											]}>
											<Input />
										</Form.Item>
									</Col>
								</Row>
								<Form.Item
									name="officerId"
									label="证件号"
									rules={[
										{
											required: true,
											pattern: /^\d{5,12}$/,
											message:
												"请输入正确的证件号（数字格式）",
										},
									]}>
									<Input />
								</Form.Item>
								<Form.Item
									name="password"
									label="密码"
									rules={[
										{
											required: true,
											message: "请输入密码",
										},
										{
											min: 6,
											message: "密码长度不能小于 6 位",
										},
									]}>
									<Input.Password />
								</Form.Item>
								<Form.Item
									name="repeatPass"
									label="确认密码"
									dependencies={["password"]}
									hasFeedback
									rules={[
										{
											required: true,
											message: "请再次输入密码",
										},
										({ getFieldValue }) => ({
											validator(_, value) {
												if (
													!value ||
													getFieldValue(
														"password"
													) === value
												) {
													return Promise.resolve();
												}
												return Promise.reject(
													new Error(
														"两次输入的密码不一致"
													)
												);
											},
										}),
									]}>
									<Input.Password />
								</Form.Item>

								<div className="flex items-center justify-center">
									<Button
										loading={registerLoading}
										type="primary"
										htmlType="submit">
										注册
									</Button>
								</div>
							</Form>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default LoginPage;
