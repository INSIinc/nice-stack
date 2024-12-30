import { TreeSelect, TreeSelectProps } from "antd";
import React, { useEffect, useState, useCallback } from "react";
import { getUniqueItems } from "@nicestack/common";
import { api } from "@nicestack/client"
import { DefaultOptionType } from "antd/es/select";

interface DepartmentSelectProps {
	defaultValue?: string | string[];
	value?: string | string[];
	onChange?: (value: string | string[]) => void;
	placeholder?: string;
	multiple?: boolean;
	rootId?: string;
	domain?: boolean;
	disabled?: boolean;
	className?: string;
}

export default function DepartmentSelect({
	defaultValue,
	value,
	onChange,
	className,
	placeholder = "选择单位",
	multiple = false,
	rootId = null,
	disabled = false,
	domain = undefined,
}: DepartmentSelectProps) {
	const utils = api.useUtils();
	const [listTreeData, setListTreeData] = useState<
		Omit<DefaultOptionType, "label">[]
	>([]);

	const fetchParentDepts = useCallback(
		async (deptIds: string | string[], rootId?: string) => {
			const idsArray = Array.isArray(deptIds) ? deptIds : [deptIds];
			try {
				return await utils.department.getParentSimpleTree.fetch({
					deptIds: idsArray,
					rootId,
					domain,
				});
			} catch (error) {
				console.error(
					"Error fetching parent departments for deptIds",
					idsArray,
					":",
					error
				);
				throw error;
			}
		},
		[utils]
	);

	const fetchDepts = useCallback(async () => {
		try {
			const rootDepts =
				await utils.department.getChildSimpleTree.fetch({
					deptIds: [rootId],
					domain,
				});
			let combinedDepts = [...rootDepts];
			if (defaultValue) {
				const defaultDepts = await fetchParentDepts(defaultValue, rootId);
				combinedDepts = getUniqueItems(
					[...listTreeData, ...combinedDepts, ...defaultDepts],
					"id"
				);
			}
			if (value) {
				const valueDepts = await fetchParentDepts(value, rootId);
				combinedDepts = getUniqueItems(
					[...listTreeData, ...combinedDepts, ...valueDepts],
					"id"
				);
			}

			setListTreeData(combinedDepts);
		} catch (error) {
			console.error("Error fetching departments:", error);
		}
	}, [defaultValue, value, rootId, utils, fetchParentDepts]);

	useEffect(() => {
		fetchDepts();
	}, [defaultValue, value, rootId, fetchDepts]);

	const handleChange = (newValue: any) => {
		if (onChange) {
			const processedValue =
				multiple && Array.isArray(newValue)
					? newValue.map((item) => item.value)
					: newValue;
			onChange(processedValue);
		}
	};

	const onLoadData: TreeSelectProps["loadData"] = async ({ id }) => {
		try {
			const result = await utils.department.getChildSimpleTree.fetch({
				deptIds: [id],
				domain,
			});
			const newItems = getUniqueItems([...listTreeData, ...result], "id");
			setListTreeData(newItems);
		} catch (error) {
			console.error(
				"Error loading data for node with id",
				id,
				":",
				error
			);
		}
	};

	const handleExpand = async (keys: React.Key[]) => {
		// console.log(keys);
		try {
			const allKeyIds =
				keys.map((key) => key.toString()).filter(Boolean) || [];
			// const expandedNodes = await Promise.all(
			// 	keys.map(async (key) => {
			// 		return await utils.department.getChildSimpleTree.fetch({
			// 			deptId: key.toString(),
			// 			domain,
			// 		});
			// 	})
			// );
			//
			//上面那样一个个拉会拉爆，必须直接拉deptIds
			const expandedNodes =
				await utils.department.getChildSimpleTree.fetch({
					deptIds: allKeyIds,
					domain,
				});
			const flattenedNodes = expandedNodes.flat();
			const newItems = getUniqueItems(
				[...listTreeData, ...flattenedNodes],
				"id"
			);
			setListTreeData(newItems);
		} catch (error) {
			console.error("Error expanding nodes with keys", keys, ":", error);
		}
	};

	const handleDropdownVisibleChange = async (open: boolean) => {
		if (open) {
			// This will attempt to expand all nodes and fetch their children when the dropdown opens
			const allKeys = listTreeData.map((item) => item.id);
			await handleExpand(allKeys);
		}
	};

	return (
		<TreeSelect
			treeDataSimpleMode
			disabled={disabled}
			showSearch
			allowClear
			defaultValue={defaultValue}
			value={value}
			className={className}
			placeholder={placeholder}
			onChange={handleChange}
			loadData={onLoadData}
			treeData={listTreeData}
			treeCheckable={multiple}
			showCheckedStrategy={TreeSelect.SHOW_ALL}
			treeCheckStrictly={multiple}
			onClear={() => handleChange(multiple ? [] : undefined)}
			onTreeExpand={handleExpand}
			onDropdownVisibleChange={handleDropdownVisibleChange}
		/>
	);
}
