import { Button, Drawer } from "antd";
import React, { useState } from "react";
import type { ButtonProps } from "antd";
import { Role } from "@nicestack/common";
import RoleForm from "./role-form";

interface RoleDrawerProps extends ButtonProps {
    title: string;
    data?: Partial<Role>;

}

export default function RoleDrawer({
    data,
    title,

    ...buttonProps
}: RoleDrawerProps) {
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
                <RoleForm data={data} ></RoleForm>
            </Drawer>
        </>
    );
}
