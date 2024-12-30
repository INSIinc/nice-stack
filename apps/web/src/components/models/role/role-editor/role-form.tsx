import { Button, Form, Input, message, Select, Spin } from "antd";
import { useContext, useEffect} from "react";
import { ObjectType, Role, RolePerms } from "@nicestack/common";
import { useRole } from "@nicestack/client";
import { api } from "@nicestack/client";
import { RoleEditorContext } from "./role-editor";

const options: { value: string; label: string }[] = Object.values(RolePerms).map((permission) => ({
    value: permission,
    label: permission,
}));

export default function RoleForm() {
    const { editRoleId, roleForm, setRoleModalOpen } = useContext(RoleEditorContext)
    const { data, isLoading }: { data: Role, isLoading: boolean } = api.role.findById.useQuery(
        { id: editRoleId },
        { enabled: !!editRoleId }
    );
    useEffect(() => {
        roleForm.resetFields();
        if (data) {
            roleForm.setFieldValue("name", data.name);
            roleForm.setFieldValue("permissions", data.permissions);
        }
    }, [data]);
    const { create, update } = useRole(); // Ensure you have these methods in your hooks
    return (
        <div className="relative">
            <Form
                disabled={isLoading}
                initialValues={data}
                form={roleForm}
                layout="vertical"
                requiredMark="optional"
                onFinish={async (values) => {

                    if (data) {
                        try {
                            await update.mutateAsync({ id: data.id, ...values });
                        } catch (err: any) {
                            message.error("更新失败");
                        }
                    } else {
                        try {
                            await create.mutateAsync(values);
                            roleForm?.resetFields();
                        } catch (err: any) {
                            message.error("创建失败");
                        }
                    }
                    message.success('提交成功')
                    setRoleModalOpen(false);
                }}
            >
                <Form.Item rules={[{ required: true }]} name={"name"} label="名称">
                    <Input />
                </Form.Item>
                <Form.Item rules={[{ required: true }]} name="permissions" label="权限">
                    <Select mode="multiple" placeholder="选择权限" options={options} />
                </Form.Item>
            </Form>
        </div>
    );
}
