import { useState } from 'react';
import { Select, Spin } from 'antd';
import type { SelectProps } from 'antd';
import { api } from '@web/src/utils/trpc';

interface StaffSelectProps {
    value?: string | string[];
    onChange?: (value: string | string[]) => void;
    style?: React.CSSProperties;
    multiple?: boolean;
    domainId?: string
}

export default function StaffSelect({ value, onChange, style, multiple, domainId }: StaffSelectProps) {
    const [keyword, setQuery] = useState<string>('');

    // Determine ids based on whether value is an array or not
    const ids = Array.isArray(value) ? value : undefined;

    // Adjust the query to include ids when they are present
    const { data, isLoading } = api.staff.findMany.useQuery({ keyword, domainId, ids });

    const handleSearch = (value: string) => {
        setQuery(value);
    };

    const options: SelectProps['options'] = data?.map((staff: any) => ({
        value: staff.id,
        label: staff.showname,
    })) || [];

    return (
        <Select
            allowClear
            showSearch
            mode={multiple ? 'multiple' : undefined}
            placeholder="请选择人员"
            notFoundContent={isLoading ? <Spin size="small" /> : null}
            filterOption={false}
            onSearch={handleSearch}
            options={options}
            value={value}
            onChange={onChange}
            style={{ minWidth: 200, ...style }}
        />
    );
}
