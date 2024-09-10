import { TreeSelect, TreeSelectProps } from "antd";
import { useEffect, useState } from "react";
import { DataNode } from "@nicestack/common";
import { useTerm } from "@web/src/hooks/useTerm";

interface TermSelectProps {
    defaultValue?: string;
    value?: string;
    onChange?: (value: string) => void;
    width?: number | string;
    placeholder?: string;
    taxonomyId: string;
    extraOptions?: { value: string | undefined, label: string }[];
}

export default function TermSelect({
    defaultValue,
    value,
    onChange,
    width = '100%',
    taxonomyId,
    placeholder = "选择术语"
}: TermSelectProps) {
    const [customTreeData, setCustomTreeData] = useState<DataNode[]>([]);
    const { treeData, addFetchParentId } = useTerm();

    useEffect(() => {
        if (treeData && taxonomyId) {
            const processedTreeData = treeData.filter(node => node.data.taxonomyId === taxonomyId);
            setCustomTreeData(processedTreeData);
        }
    }, [treeData, taxonomyId]);

    const [selectedValue, setSelectedValue] = useState<string | undefined>(defaultValue);

    useEffect(() => {
        if (value) {
            setSelectedValue(value);
        } else if (defaultValue) {
            setSelectedValue(defaultValue);
        }
    }, [defaultValue, value]);

    const handleChange = (newValue: string) => {
        setSelectedValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    const onLoadData: TreeSelectProps['loadData'] = async ({ id }) => {
        addFetchParentId(id);
    };

    const handleExpand = (expandedKeys: React.Key[]) => {
        console.log(expandedKeys)
        // addFetchParentId(node.key as string);
    };

    return (
        <TreeSelect
            allowClear
            value={selectedValue}
            style={{ width }}
            placeholder={placeholder}
            onChange={handleChange}
            loadData={onLoadData}
            onTreeExpand={handleExpand}
            treeData={customTreeData}
        />
    );
}
