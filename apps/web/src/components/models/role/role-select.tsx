import { useState } from 'react';
import { Select, Spin } from 'antd';
import type { SelectProps } from 'antd';
import { api } from '@admin/src/utils/trpc';

interface RoleSelectProps {
    value?: string | string[];
    onChange?: (value: string | string[]) => void;
    style?: React.CSSProperties;
    multiple?: boolean;
}

export default function RoleSelect({ value, onChange, style, multiple }: RoleSelectProps) {
    const [keyword, setQuery] = useState<string>('');
    const { data, isLoading } = api.role.findMany.useQuery({ keyword });

    const handleSearch = (value: string) => {
        setQuery(value);
    };

    const options: SelectProps['options'] = data?.map((role: any) => ({
        value: role.id,
        label: role.name,
    })) || [];

    return (
        <Select
            allowClear
            showSearch
            mode={multiple ? 'multiple' : undefined}
            placeholder="请选择角色"
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
