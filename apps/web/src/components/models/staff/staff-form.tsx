import { Button, Form, Input, message } from "antd";
import { FormInstance } from "antd";
import { useEffect, useRef, useState } from "react";
import { Staff } from "@nicestack/common"; // Adjust the import path if necessary
import DomainSelect from "../domain/domain-select";
import { useStaff } from "@web/src/hooks/useStaff";
import DepartmentSelect from "../department/department-select";

export default function StaffForm({
    data,
    deptId,
    domainId
}: {
    data?: Partial<Staff>;
    deptId: string;
    parentId?: string;
    domainId?: string
}) {
    const { create, update } = useStaff(); // Ensure you have these methods in your hooks
    const [loading, setLoading] = useState(false);
    const [selectedDomainId, setSelectedDomainId] = useState(domainId);
    const formRef = useRef<FormInstance>(null);

    useEffect(() => {

        if (deptId) formRef.current?.setFieldValue("deptId", deptId);
    }, [deptId]);

    useEffect(() => {
        if (domainId) {
            formRef.current?.setFieldValue("domainId", domainId);
            setSelectedDomainId(domainId)
        }
    }, [domainId]);

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
                        if (deptId)
                            formRef.current?.setFieldValue("deptId", deptId);
                        if (domainId)
                            formRef.current?.setFieldValue("domainId", domainId);
                    } catch (err) {
                        message.error("创建失败");
                    }
                }
                setLoading(false);
            }}
        >
            <Form.Item rules={[{ required: true }]} name={"phoneNumber"} label="手机号">
                <Input />
            </Form.Item>
            <Form.Item rules={[{ required: true }]} name={"name"} label="名称">
                <Input />
            </Form.Item>

            <Form.Item name={'domainId'} label='所属域'>
                <DomainSelect
                    onChange={(value) => {
                        setSelectedDomainId(value);
                        formRef.current?.setFieldValue('domainId', value);
                    }}
                />
            </Form.Item>

            <Form.Item name={'deptId'} label='所属单位'>
                <DepartmentSelect rootId={selectedDomainId} />
            </Form.Item>

            <div className="flex justify-center items-center p-2">
                <Button loading={loading} htmlType="submit" type="primary">
                    提交
                </Button>
            </div>
        </Form>
    );
}
