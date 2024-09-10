import { Button, ButtonProps, Drawer } from "antd";
import { useMemo, useState } from "react";
import { Taxonomy } from "@nicestack/common";
import TaxonomyForm from "./taxonomy-form";
interface TaxonomyDrawerProps extends ButtonProps {
    data?: Partial<Taxonomy>;
    title: string;
}

export default function TaxonomyDrawer({
    data,
    title,
    ...buttonProps
}: TaxonomyDrawerProps) {
    const [open, setOpen] = useState(false);
    const drawerTitle = useMemo(() => {
        return data ? '编辑分类法' : '创建分类法';
    }, [data]);

    const handleTrigger = () => {
        setOpen(true);
    };

    return (
        <>
            <Button {...buttonProps} onClick={handleTrigger}>
                {title}
            </Button>
            <Drawer
                open={open}
                onClose={() => {
                    setOpen(false);
                }}
                title={drawerTitle}
                width={400}
            >
                <TaxonomyForm data={data}></TaxonomyForm>
            </Drawer>
        </>
    );
}