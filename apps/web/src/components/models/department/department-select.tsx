import { Button, TreeSelect, TreeSelectProps } from "antd";
import { useEffect, useState } from "react";
import { DataNode, findNodeByKey } from "@nicestack/common";
import { useDepartment } from "@web/src/hooks/useDepartment";
import { api } from "@web/src/utils/trpc";

interface DepartmentSelectProps {
	defaultValue?: string | string[];
	value?: string | string[];
	onChange?: (value: string | string[]) => void;
	width?: number | string;
	placeholder?: string;
	multiple?: boolean;
	rootId?: string;
	extraOptions?: { value: string | undefined; label: string }[];
}

export default function DepartmentSelect({
	defaultValue,
	value,
	onChange,
	width = "100%",
	placeholder = "选择单位",
	multiple = false,
	rootId,
}: DepartmentSelectProps) {
	const { treeData, addFetchParentId } = useDepartment();
	api.useQueries((t) => {
		if (Array.isArray(defaultValue)) {
			return defaultValue?.map((id) =>
				t.department.getDepartmentDetails({ deptId: id })
			);
		} else {
			return [];
		}
	});
	const [filteredTreeData, setFilteredTreeData] = useState<DataNode[]>([]);
	const [selectedValue, setSelectedValue] = useState(() => {
		if (value) {
			if (Array.isArray(value)) {
				return value.map((item) => ({
					label: item,
					value: item,
				}));
			} else {
				return { label: value, value: value };
			}
		}
		return undefined; // 如果没有提供defaultValue，返回null或者合适的初始值
	});

	const findNodeByKey = (data: DataNode[], key: string): DataNode | null => {
		for (let node of data) {
			if (node.key === key) return node;
			if (node.children) {
				const found = findNodeByKey(node.children, key);
				if (found) return found;
			}
		}
		return null;
	};

	useEffect(() => {
		if (rootId && treeData.length > 0) {
			const rootNode = findNodeByKey(treeData, rootId);
			if (rootNode) {
				setFilteredTreeData([rootNode]);
			} else {
				setFilteredTreeData([]);
			}
		} else {
			setFilteredTreeData(treeData);
		}
	}, [rootId, treeData]);

	useEffect(() => {
		if (rootId) {
			setSelectedValue(undefined);
			addFetchParentId(rootId);
		}
	}, [rootId]);

	useEffect(() => {
		if (defaultValue) {
			if (Array.isArray(defaultValue)) {
				setSelectedValue(
					defaultValue.map((item) => ({ label: item, value: item }))
				);
			} else {
				setSelectedValue({ label: defaultValue, value: defaultValue });
			}
		}
		if (value) {
			if (Array.isArray(value)) {
				setSelectedValue(
					value.map((item) => ({ label: item, value: item }))
				);
			} else {
				setSelectedValue({ label: value, value: value });
			}
		}
	}, [defaultValue, value]);

	const handleChange = (newValue: any) => {
		setSelectedValue(newValue);
		if (onChange) {
			if (multiple && Array.isArray(newValue)) {
				onChange(newValue.map((item) => item.value));
			} else {
				onChange(newValue);
			}
		}
	};

	const onLoadData: TreeSelectProps["loadData"] = async ({ id }) => {
		addFetchParentId(id);
	};

	const handleExpand = (expandedKeys: React.Key[]) => {
		(expandedKeys as string[]).forEach((id: string) =>
			addFetchParentId(id)
		);
	};

	return (
		<>
			<TreeSelect

				allowClear
				value={selectedValue}
				style={{ minWidth: 200, width }}
				placeholder={placeholder}
				onChange={handleChange}
				loadData={onLoadData}
				treeData={filteredTreeData}
				treeCheckable={multiple}
				showCheckedStrategy={TreeSelect.SHOW_ALL}
				treeCheckStrictly={multiple}
				onClear={() => handleChange(multiple ? [] : undefined)}
				onTreeExpand={handleExpand}
			/>
		</>
	);
}
