import { Button, Drawer } from "antd";
import React, { useState } from "react";
import type { ButtonProps } from "antd";
import { Department } from "@nicestack/common";
import DepartmentForm from "./department-form";

interface DepartmentDrawerProps extends ButtonProps {
    title: string;
    data?: Partial<Department>;
    parentId?: string;
}

export default function DepartmentDrawer({
    data,
    parentId,
    title,
    ...buttonProps
}: DepartmentDrawerProps) {
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
                <DepartmentForm data={data} parentId={parentId}></DepartmentForm>
            </Drawer>
        </>
    );
}
