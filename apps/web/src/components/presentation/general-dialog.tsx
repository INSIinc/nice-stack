// GeneralDialog.tsx
import React, { useState, useImperativeHandle, forwardRef, ReactNode } from 'react';
import { Button } from "antd";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeading } from './dialog';

interface GeneralDialogProps {
    title?: string;
    handleOk?: () => void;
    onClose?: (open: boolean) => void;
    children: ReactNode;
    confirmText?: string;
    initialOpen?: boolean;
    trigger?: ReactNode; // New trigger prop
}

export interface GeneralDialogRef {
    open: () => void;
    close: () => void;
}

const GeneralDialog: React.ForwardRefRenderFunction<GeneralDialogRef, GeneralDialogProps> = ({
    children,
    handleOk,
    title,
    onClose,
    confirmText,
    initialOpen = false,
    trigger, // Destructure the trigger prop
}, ref) => {
    const [open, setOpen] = useState(initialOpen);

    const handleClose = (value: boolean) => {
        setOpen(value);
        onClose?.(value);
    };

    // Expose open and close methods to parent component via ref
    useImperativeHandle(ref, () => ({
        open: () => setOpen(true),
        close: () => setOpen(false),
    }));

    return (
        <>
            {trigger && React.cloneElement(trigger as React.ReactElement, { onClick: () => setOpen(true) })}
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="bg-white mt-32 mx-64 rounded-lg shadow-xl text-default">
                    {title && <DialogHeading>{title}</DialogHeading>}
                    <DialogDescription>
                        {children}
                    </DialogDescription>
                    <DialogFooter>
                        <div className="flex items-center justify-end gap-4 p-2.5">
                            <Button type="text" onClick={() => handleClose(false)}>取消</Button>
                            <Button type="primary" onClick={() => { if (handleOk) handleOk() }}>{confirmText || "确定"}</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default forwardRef(GeneralDialog);
