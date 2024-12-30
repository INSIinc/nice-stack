 import { TreeSelect } from "antd";
import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@nicestack/client"
interface TermSelectProps {
	defaultValue?: string | string[];
	value?: string | string[];
	onChange?: (value: string | string[]) => void;
	variant?: "outlined" | "borderless" | "filled";
	placeholder?: string;
	taxonomyId?: string;
	taxonomySlug?: string;
	extraOptions?: { value: string | undefined; label: string }[];
	multiple?: boolean;
	className?: string;
	domainId?: string;
	disabled?: boolean;
}

export default function TermSelect({
	defaultValue,
	value,
	onChange,
	variant = "outlined",
	taxonomyId,
	taxonomySlug,
	domainId = undefined,
	placeholder = "选择术语",
	multiple = false,
	className,
	disabled = false,
}: TermSelectProps) {
	const { data, error } = api.term.getTreeData.useQuery(
		{ taxonomyId, taxonomySlug, domainId },
		{
			enabled: !!taxonomyId || !!taxonomySlug,
		}
	);

	const [selectedValue, setSelectedValue] = useState<
		string | string[] | undefined
	>(() => defaultValue);

	useEffect(() => {
		if (value !== undefined) {
			setSelectedValue(value);
		}
	}, [value]);

	const handleChange = useCallback(
		(newValue: string | string[]) => {
			setSelectedValue(newValue);
			if (onChange) {
				onChange(newValue);
			}
		},
		[onChange]
	);

	const filterTreeNode = useCallback((input: string, node: any) => {
		return node?.title?.toLowerCase().indexOf(input.toLowerCase()) >= 0;
	}, []);

	const effectivePlaceholder = useMemo(() => {
		return error ? "加载失败,请重试" : placeholder;
	}, [error, placeholder]);

	return (
		<TreeSelect
			variant={variant}
			allowClear
			className={className}
			value={selectedValue}
			defaultValue={defaultValue}
			placeholder={effectivePlaceholder}
			onChange={handleChange}
			showSearch
			treeLine
			treeData={data ?? []}
			treeCheckable={multiple}
			showCheckedStrategy={TreeSelect.SHOW_CHILD}
			multiple={multiple}
			filterTreeNode={filterTreeNode}
			disabled={!!error || disabled}
			style={{
				width: "100%",
				overflow: "hidden",
				textOverflow: "ellipsis",
				whiteSpace: "nowrap",
			}}
		/>
	);
}
