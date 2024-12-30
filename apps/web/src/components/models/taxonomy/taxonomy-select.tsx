import { Button, Select } from "antd";
import { api } from "@nicestack/client"
import { useEffect, useState } from "react";

// 定义组件的 props 类型
interface TaxonomySelectProps {
	defaultValue?: string;
	value?: string;
	onChange?: (value: string) => void;
	width?: number | string; // 修改类型，支持百分比
	placeholder?: string;
	extraOptions?: { value: string | undefined; label: string }[]; // 新增 extraOptions 属性
}

export default function TaxonomySelect({
	defaultValue,
	value,
	onChange,
	width = "100%", // 默认设置为 100%
	placeholder = "选择分类",
	extraOptions = [], // 默认值为空数组
}: TaxonomySelectProps) {
	const { data: taxonomies, isLoading: isTaxLoading } =
		api.taxonomy.getAll.useQuery({});

	const [selectedValue, setSelectedValue] = useState<string | undefined>(
		defaultValue
	);

	// 当 defaultValue 或 value 改变时，将其设置为 selectedValue
	useEffect(() => {
		if (value !== undefined) {
			setSelectedValue(value);
		} else if (defaultValue !== undefined) {
			setSelectedValue(defaultValue);
		}
	}, [defaultValue, value]);

	// 内部处理选择变化，并调用外部传入的 onChange 回调（如果有的话）
	const handleChange = (newValue: string) => {
		setSelectedValue(newValue);
		if (onChange) {
			onChange(newValue);
		}
	};

	return (
		<>

			<Select
				allowClear
				value={selectedValue}
				style={{ width }}
				options={[
					...(taxonomies?.map((tax) => ({
						value: tax.id,
						label: tax.name,
					})) || []),
					...extraOptions, // 添加额外选项
				]}
				loading={isTaxLoading}
				placeholder={placeholder}
				onChange={handleChange}
			/>
		</>
	);
}
