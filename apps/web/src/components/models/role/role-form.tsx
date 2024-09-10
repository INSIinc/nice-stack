import { Button, Form, Input, message, Select } from "antd";
import { FormInstance } from "antd";
import { useEffect, useRef, useState } from "react";
import { Role, RolePerms } from "@nicestack/common";
import { useRole } from "@web/src/hooks/useRole";

const options: { value: string; label: string }[] = Object.values(RolePerms).map((permission) => ({
    value: permission,
    label: permission,
}));

export default function RoleForm({
    data,

}: {
    data?: Partial<Role>;

}) {
    const { create, update } = useRole(); // Ensure you have these methods in your hooks
    const [loading, setLoading] = useState(false);
    const formRef = useRef<FormInstance>(null);


    return (
        <Form
            initialValues={data}

            ref={formRef}
            layout="vertical"
            requiredMark="optional"
            onFinish={async (values) => {
                console.log("Received values:", values);
                setLoading(true);
                if (data) {
                    try {
                        await update.mutateAsync({ id: data.id, ...values });
                    } catch (err) {
                        message.error("更新失败");
                    }
                } else {
                    try {
                        await create.mutateAsync(values);
                        formRef.current?.resetFields();
                    } catch (err) {
                        message.error("创建失败");
                    }
                }
                setLoading(false);
            }}
        >
            <Form.Item rules={[{ required: true }]} name={"name"} label="名称">
                <Input />
            </Form.Item>
            <Form.Item rules={[{ required: true }]} name="permissions" label="权限">
                <Select mode="multiple" placeholder="选择权限" options={options} />
            </Form.Item>
            <div className="flex justify-center items-center p-2">
                <Button loading={loading} htmlType="submit" type="primary">
                    提交
                </Button>
            </div>
        </Form>
    );
}
