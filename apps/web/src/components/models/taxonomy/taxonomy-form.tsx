import { Button, Form, Input } from "antd";
import { FormInstance } from "antd";
import { useRef, useState } from "react";
import { Taxonomy } from "@nicestack/common"
import { useTaxonomy } from "@web/src/hooks/useTaxonomy";
export default function TaxonomyForm({ data = undefined }: { data?: Partial<Taxonomy> }) {
    const { create, update } = useTaxonomy()
    const [loading, setLoading] = useState(false)
    const formRef = useRef<FormInstance>(null)
    return <Form initialValues={data} ref={formRef} layout="vertical" requiredMark='optional' onFinish={async (values) => {
        console.log(values)
        setLoading(true)
        if (data) {
            await update.mutateAsync({ id: data.id, ...values })
        } else {
            await create.mutateAsync(values)
            formRef.current?.resetFields()
        }
        setLoading(false)

    }}>
        <Form.Item rules={[{ required: true }]} name={'name'} label='名称'>
            <Input></Input>
        </Form.Item>
        {/* <Form.Item rules={[{ required: true }]} name={'slug'} label='别名'>
            <Input></Input>
        </Form.Item> */}
        <div className="flex justify-center items-center p-2">
            <Button loading={loading} htmlType="submit" type="primary"> 提交</Button>
        </div>
    </Form>
}