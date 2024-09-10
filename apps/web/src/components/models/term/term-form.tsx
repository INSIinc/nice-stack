import { Button, Form, Input, message, Checkbox } from "antd";
import { FormInstance } from "antd";
import { useEffect, useRef, useState } from "react";
import { Term } from "@nicestack/common"; // Adjust the import path if necessary
import { useTerm } from "@web/src/hooks/useTerm";
import DepartmentSelect from "../department/department-select";
import DomainSelect from "../domain/domain-select";
import StaffSelect from "../staff/staff-select";
import TaxonomySelect from "../taxonomy/taxonomy-select";
import TermSelect from "./term-select";

export default function TermForm({
  data,
  taxonomyId,
  parentId,
  domainId
}: {
  data?: Partial<Term>;
  taxonomyId: string;
  parentId?: string;
  domainId?: string
}) {
  const { create, update, addFetchParentId } = useTerm(); // Ensure you have these methods in your hooks
  const [loading, setLoading] = useState(false);
  const formRef = useRef<FormInstance>(null);
  const [selectedDomainId, setSelectedDomainId] = useState(domainId);
  useEffect(() => {
    if (taxonomyId) formRef.current?.setFieldValue("taxonomyId", taxonomyId);
  }, [taxonomyId]);
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
        setLoading(true);
        addFetchParentId(values.parentId)
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
            if (taxonomyId)
              formRef.current?.setFieldValue("taxonomyId", taxonomyId);
            if (domainId)
              formRef.current?.setFieldValue("domainId", domainId);
          } catch (err) {
            message.error("创建失败");
          }
        }
        setLoading(false);
      }}
    >
      <Form.Item name={'domainId'} label='所属域'>
        <DomainSelect onChange={(value) => {
          setSelectedDomainId(value);
          formRef.current?.setFieldValue('domainId', value);
        }}></DomainSelect>
      </Form.Item>

      <Form.Item
        rules={[{ required: true }]}
        name={"taxonomyId"}
        label="所属分类法"
      >
        <TaxonomySelect></TaxonomySelect>
      </Form.Item>
      <Form.Item rules={[{ required: true }]} name={"name"} label="名称">
        <Input />
      </Form.Item>
      {/* <Form.Item rules={[{ required: true }]} name={"slug"} label="别名">
        <Input />
      </Form.Item> */}
      <Form.Item initialValue={parentId} name={"parentId"} label="父术语">
        <TermSelect taxonomyId={taxonomyId}></TermSelect>
      </Form.Item>
      <Form.Item name={'watchStaffIds'} label='可见人员'>
        <StaffSelect multiple></StaffSelect>
      </Form.Item>
      <Form.Item name={'watchDeptIds'} label='可见单位'>
        <DepartmentSelect rootId={selectedDomainId} multiple />
      </Form.Item>
      <div className="flex justify-center items-center p-2">
        <Button loading={loading} htmlType="submit" type="primary">
          提交
        </Button>
      </div>
    </Form>
  );
}
