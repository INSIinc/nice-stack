import { Button, Drawer } from "antd";
import React, { useState } from "react";
import type { ButtonProps } from "antd";
import { Term } from "@nicestack/common";
import TermForm from "./term-form";

interface TermDrawerProps extends ButtonProps {
    title: string;
    data?: Partial<Term>;
    parentId?: string;
    taxonomyId: string,
    domainId?: string
}

export default function TermDrawer({
    data,
    parentId,
    title,
    taxonomyId,
    domainId,
    ...buttonProps
}: TermDrawerProps) {
    const [open, setOpen] = useState(false);
    const handleTrigger = () => {
        setOpen(true);
    };

    return (
        <>
            <Button {...buttonProps} onClick={handleTrigger}>{title}</Button>
            <Drawer
                open={open}
                onClose={() => {
                    setOpen(false);
                }}
                title={title}
                width={400}
            >
                <TermForm domainId={domainId} taxonomyId={taxonomyId} data={data} parentId={parentId}></TermForm>
            </Drawer>
        </>
    );
}
