import { Modal } from "antd";
import { TermEditorContext } from "./term-editor";
import { useContext } from "react";
import TaxonomyForm from "./taxonomy-form";

export default function TaxonomyModel() {
    const { editTaxonomyId, taxonomyForm, setTaxonomyModalOpen, taxonomyModalOpen } = useContext(TermEditorContext)
    const handleOk = () => {
        taxonomyForm.submit();
    };
    return <Modal

        onOk={() => handleOk()}
        open={taxonomyModalOpen}
        onCancel={() => {
            setTaxonomyModalOpen(false);
        }}
        title={editTaxonomyId ? '编辑分类法' : '创建分类法'}
        width={400}
    >
        <TaxonomyForm></TaxonomyForm>
    </Modal>
}