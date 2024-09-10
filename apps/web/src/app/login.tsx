import React, { useState, useRef, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import DepartmentSelect from '../components/models/department/department-select';
import { useAuth } from '../providers/auth-provider';
import SineWave from '../components/presentation/animation/sine-wave';

const LoginPage: React.FC = () => {
    const [showLogin, setShowLogin] = useState(true);
    const [registerLoading, setRegisterLoading] = useState(false);
    const { login, isAuthenticated, signup } = useAuth();
    const loginFormRef = useRef<any>(null);
    const registerFormRef = useRef<any>(null);
    const location = useLocation();
    const navigate = useNavigate();

    const onFinishLogin = async (values: any) => {
        try {
            const { username, password } = values;
            await login(username, password);
            message.success('登录成功！');
        } catch (err) {
            message.error('用户名或密码错误！');
            console.error(err);
        }
    };

    const onFinishRegister = async (values: any) => {
        setRegisterLoading(true);
        const { username, password, phoneNumber } = values;
        try {
            await signup(username, password, phoneNumber);
            message.success('注册成功！');
            setShowLogin(true);
            loginFormRef.current.submit();
        } catch (err) {
            console.error(err);
        } finally {
            setRegisterLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            const params = new URLSearchParams(location.search);
            const redirectUrl = params.get('redirect_url') || '/';
            navigate(redirectUrl, { replace: true });
        }
    }, [isAuthenticated, location]);

    return (
        <div className="flex justify-center items-center h-screen w-full bg-layout">
            <div className="flex items-center transition-all overflow-hidden bg-container rounded-xl " style={{ width: 800, height: 600 }}>
                <div className="flex-1 py-10 px-10">
                    {showLogin ? (
                        <>
                            <div className="text-center text-2xl text-primary select-none">
                                <span className="px-2">登录</span>
                            </div>
                            <Form ref={loginFormRef} onFinish={onFinishLogin} layout="vertical" requiredMark="optional" size="large">
                                <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                                    <Input />
                                </Form.Item>

                                <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
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
                        <div >

                            <div className="text-center text-2xl text-primary">注册</div>
                            <Form requiredMark="optional" ref={registerFormRef} onFinish={onFinishRegister} layout="vertical" size="large">
                                <Form.Item name="username" label="用户名" rules={[
                                    { required: true, message: '请输入用户名' },
                                    { min: 3, max: 15, message: '用户名长度在 3 到 15 个字符' }
                                ]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item name="phoneNumber" label="手机号" rules={[
                                    { required: false },
                                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                                ]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item name="password" label="密码" rules={[
                                    { required: true, message: '请输入密码' },
                                    { min: 6, message: '密码长度不能小于 6 位' }
                                ]}>
                                    <Input.Password />
                                </Form.Item>
                                <Form.Item name="repeatPass" label="确认密码" dependencies={['password']} hasFeedback rules={[
                                    { required: true, message: '请再次输入密码' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('两次输入的密码不一致'));
                                        }
                                    })
                                ]}>
                                    <Input.Password />
                                </Form.Item>

                                <div className="flex items-center justify-center">
                                    <Button loading={registerLoading} type="primary" htmlType="submit">
                                        注册
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    )}
                </div>
                <div className={`transition-all h-full flex-1 text-white p-10 flex items-center justify-center bg-primary`}>
                    {showLogin ? (
                        <div className="flex flex-col">
                            <SineWave width={300} height={200} />
                            <div className="text-2xl my-4">没有账号？</div>
                            <div className="my-4 font-thin text-sm">点击注册一个属于你自己的账号吧！</div>
                            <div
                                onClick={() => setShowLogin(false)}
                                className="hover:translate-y-1 my-8 p-2 text-center rounded-xl border-white border hover:bg-white hover:text-primary hover:shadow-xl hover:cursor-pointer transition-all"
                            >
                                注册
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <div className="text-2xl my-4">注册小贴士</div>
                            <div className="my-4 font-thin text-sm">请认真填写用户信息哦！</div>
                            <div
                                onClick={() => setShowLogin(true)}
                                className="hover:translate-y-1 my-8 rounded-xl text-center border-white border p-2 hover:bg-white hover:text-primary hover:shadow-xl hover:cursor-pointer transition-all"
                            >
                                返回登录
                            </div>
                            <SineWave width={300} height={200} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
