import { TreeSelect, TreeSelectProps } from "antd";
import React, { useEffect, useState, useCallback } from "react";
import { getUniqueItems } from "@nicestack/common";
import { api } from "@nicestack/client";
import { DefaultOptionType } from "antd/es/select";

interface TermSelectProps {
	defaultValue?: string | string[];
	value?: string | string[];
	onChange?: (value: string | string[]) => void;
	placeholder?: string;
	multiple?: boolean;
	// rootId?: string;
	// domain?: boolean;
	taxonomyId?: string;
	disabled?: boolean;
	className?: string;
}

export default function TermSelect({
	defaultValue,
	value,
	onChange,
	className,
	placeholder = "选择单位",
	multiple = false,
	taxonomyId,
	// rootId = null,
	disabled = false,
	// domain = undefined,
}: TermSelectProps) {
	const utils = api.useUtils();
	const [listTreeData, setListTreeData] = useState<
		Omit<DefaultOptionType, "label">[]
	>([]);

	const fetchParentTerms = useCallback(
		async (termIds: string | string[], taxonomyId?: string) => {
			const idsArray = Array.isArray(termIds)
				? termIds
				: [termIds].filter(Boolean);
			try {
				return await utils.term.getParentSimpleTree.fetch({
					termIds: idsArray,
					taxonomyId,
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

	const fetchTerms = useCallback(async () => {
		try {
			const rootDepts = await utils.term.getChildSimpleTree.fetch({
				taxonomyId,
			});
			let combinedDepts = [...rootDepts];
			if (defaultValue) {
				const defaultDepts = await fetchParentTerms(
					defaultValue,
					taxonomyId
				);
				combinedDepts = getUniqueItems(
					[...listTreeData, ...combinedDepts, ...defaultDepts] as any,
					"id"
				);
			}
			if (value) {
				const valueDepts = await fetchParentTerms(value, taxonomyId);
				combinedDepts = getUniqueItems(
					[...listTreeData, ...combinedDepts, ...valueDepts] as any,
					"id"
				);
			}

			setListTreeData(combinedDepts);
		} catch (error) {
			console.error("Error fetching departments:", error);
		}
	}, [defaultValue, value, taxonomyId, utils, fetchParentTerms]);

	useEffect(() => {
		fetchTerms();
	}, [defaultValue, value, taxonomyId, fetchTerms]);

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
			const result = await utils.term.getChildSimpleTree.fetch({
				termIds: [id],
				taxonomyId,
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
			const expandedNodes = await utils.term.getChildSimpleTree.fetch({
				termIds: allKeyIds,
				taxonomyId,
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
