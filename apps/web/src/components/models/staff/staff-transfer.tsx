import { Avatar, theme, Transfer, TransferProps } from "antd";
import { StaffDto } from "@nicestack/common";
import React, { forwardRef, useImperativeHandle, useMemo, useState } from "react";

// Define the ref type
export interface StaffTransferRef {
    resetSelection: () => void;
}

interface StaffTransferProps {
    staffs?: StaffDto[];
    onChange?: (targetKeys: string[]) => void;
}

interface TransferRecordType {
    key: string;
    title: string;
    description?: string;
    chosen: boolean;
}

const StaffTransfer = forwardRef<StaffTransferRef, StaffTransferProps>(({ staffs = [], onChange: externalOnChange }, ref) => {
    const [targetKeys, setTargetKeys] = useState<React.Key[]>([]);
    const { token } = theme.useToken();

    const dataSource = useMemo<TransferRecordType[]>(() => {
        // console.log(staffs)
        return staffs.map(staff => ({
            key: staff.id,
            title: staff.showname || staff.username,
            description: staff.officerId,
            chosen: false
        }));
    }, [staffs]);

    const handleChange: TransferProps['onChange'] = (newTargetKeys, direction, moveKeys) => {
        setTargetKeys(newTargetKeys);
        // console.log(newTargetKeys);
        if (externalOnChange) {
            externalOnChange(newTargetKeys as string[]);
        }
    };

    const filterOption = (inputValue: string, item: TransferRecordType) =>
        item.title.toLowerCase().includes(inputValue.toLowerCase()) ||
        item.description?.toLowerCase().includes(inputValue.toLowerCase());

    useImperativeHandle(ref, () => ({
        resetSelection: () => {
            setTargetKeys([]);
        }
    }));

    return (
        <Transfer
            dataSource={dataSource}
            targetKeys={targetKeys}
            oneWay={true}
            onChange={handleChange}
            showSearch
            filterOption={filterOption}
            listStyle={{
                width: 400,
                height: 450,
            }}
            render={(item) => (
                <div className="flex items-center gap-2">
                    <Avatar style={{ background: token.colorPrimary }}>
                        {item.title?.slice(0, 1).toUpperCase()}
                    </Avatar>
                    <span>{item.title}</span>
                    <span className="text-tertiary">{item.description}</span>
                </div>
            )}
        />
    );
});

export default StaffTransfer;
