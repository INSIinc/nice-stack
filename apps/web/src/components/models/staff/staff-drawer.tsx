import { Button, Drawer } from "antd";
import React, { useState } from "react";
import type { ButtonProps } from "antd";
import { Staff } from "@nicestack/common";
import StaffForm from "./staff-form";

interface StaffDrawerProps extends ButtonProps {
    title: string;
    data?: Partial<Staff>;
    deptId?: string;
    domainId?: string
}

export default function StaffDrawer({
    data,
    deptId,
    title,
    domainId,
    ...buttonProps
}: StaffDrawerProps) {
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
                <StaffForm domainId={domainId} deptId={deptId} data={data} ></StaffForm>
            </Drawer>
        </>
    );
}
