import { useMemo, useState } from "react";
import { Button, Select, Spin } from "antd";
import type { SelectProps } from "antd";
import { api } from "@nicestack/client";
interface StaffSelectProps {
	value?: string | string[];
	onChange?: (value: string | string[]) => void;
	style?: React.CSSProperties;
	multiple?: boolean;
	domainId?: string;
	placeholder?: string;
}

export default function StaffSelect({
	value,
	onChange,
	placeholder,
	style,
	multiple,
	domainId,
}: StaffSelectProps) {
	const [keyword, setQuery] = useState<string>("");

	// Determine ids based on whether value is an array or not
	const ids = useMemo(() => {
		return Array.isArray(value) ? value : [];
	}, [value]);

	// Adjust the query to include ids when they are present
	const { data, isLoading } = api.staff.findMany.useQuery({
		where: {
			OR: [
				{
					username: {
						contains: keyword,
					},
				},
				{
					showname: {
						contains: keyword,
					},
				},
				{
					id: {
						in: ids
					}
				}
			],
			domainId,

		},
		select: { id: true, showname: true, username: true },
		take: 30,
		orderBy: { order: "asc" }
	});

	const handleSearch = (value: string) => {
		setQuery(value);
	};

	const options: SelectProps["options"] =
		data?.map((staff: any) => ({
			value: staff.id,
			label: staff?.showname || staff?.username,
		})) || [];

	return (
		<>
			<Select
				allowClear
				showSearch
				mode={multiple ? "multiple" : undefined}
				placeholder={placeholder || "请选择人员"}
				notFoundContent={isLoading ? <Spin size="small" /> : null}
				filterOption={false}
				onSearch={handleSearch}
				options={options}
				value={value}
				onChange={onChange}
				style={{ minWidth: 200, ...style }}
			/>{" "}
		</>
	);
}
