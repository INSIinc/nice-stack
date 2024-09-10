import { Button, Form, Input, InputNumber, Checkbox } from "antd";
import { FormInstance } from "antd";
import { useEffect, useRef, useState } from "react";
import { Department } from "@nicestack/common";
import { useDepartment } from "@web/src/hooks/useDepartment";
import DepartmentSelect from "./department-select";

export default function DepartmentForm({
  data = undefined,
  parentId,
}: {
  data?: Partial<Department>;
  parentId?: string;
}) {
  const { create, update, addFetchParentId } = useDepartment();
  const [loading, setLoading] = useState(false);
  const formRef = useRef<FormInstance>(null);
  useEffect(() => {
    if (parentId) formRef.current?.setFieldValue("parentId", parentId);
  }, [parentId]);
  return (
    <Form
      initialValues={data}
      ref={formRef}
      layout="vertical"
      requiredMark="optional"
      onFinish={async (values) => {
        setLoading(true);
        addFetchParentId(values.parentId);
        console.log(values)
        if (data) {
          console.log(values);
          await update.mutateAsync({ id: data.id, ...values });
        } else {
          await create.mutateAsync(values);
          formRef.current?.resetFields();
          if (parentId) formRef.current?.setFieldValue("parentId", parentId);
        }
        setLoading(false);
      }}
    >
      <Form.Item rules={[{ required: true }]} name={"name"} label="名称">
        <Input></Input>
      </Form.Item>
      <Form.Item name={"parentId"} label="父单位">
        <DepartmentSelect></DepartmentSelect>
      </Form.Item>
      <Form.Item name={"order"} label="顺序">
        <InputNumber></InputNumber>
      </Form.Item>
      <Form.Item name={"isDomain"} valuePropName="checked">
        <Checkbox>是否为域</Checkbox>
      </Form.Item>
      <div className="flex justify-center items-center p-2">
        <Button loading={loading} htmlType="submit" type="primary">
          {" "}
          提交
        </Button>
      </div>
    </Form>
  );
}
