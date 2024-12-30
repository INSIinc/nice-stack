import { Button, Drawer, Modal } from "antd";
import { useContext } from "react";
import TermForm from "./term-form";
import { TermEditorContext } from "./term-editor";

export default function TermModal() {
    const { editId, termForm, termModalOpen, setTermModalOpen, setEditId, setParentId } = useContext(TermEditorContext)
    const handleOk = () => {
        termForm.submit();
    };
    return (
        <>
            <Modal
                onOk={() => handleOk()}
                open={termModalOpen}
                onCancel={() => {
                    setTermModalOpen(false);
                    setEditId(undefined)
                    setParentId(undefined)
                }}
                title={editId ? '编辑分类' : '创建分类'}
                width={400}
            >
                <TermForm></TermForm>
            </Modal>
        </>
    );
}
