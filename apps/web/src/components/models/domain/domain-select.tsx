import { useState } from 'react';
import { Select, Spin } from 'antd';
import type { SelectProps } from 'antd';
import { api } from '@web/src/utils/trpc';

interface DomainSelectProps {
    value?: string;
    onChange?: (value: string | undefined) => void;
    style?: React.CSSProperties;
    showAll?: boolean; // New prop to control inclusion of '全部'
}

export default function DomainSelect({ value, onChange, style, showAll = false }: DomainSelectProps) {
    const [query, setQuery] = useState<string>('');
    const { data, isLoading } = api.department.getDomainDepartments.useQuery({ query });

    const handleSearch = (value: string) => {
        setQuery(value);
    };

    const handleChange = (value: string | undefined) => {
        if (onChange) {
            if (value === 'all') {
                onChange(undefined)
            } else {
                onChange(value === undefined ? null : value);
            }
        }
    };

    const options: SelectProps['options'] = [
        ...(showAll ? [{ value: 'all', label: '全部' }] : []),
        ...(data?.map((domain: any) => ({
            value: domain.id,
            label: domain.name,
        })) || []),
    ];

    return (
        <Select
            allowClear
            showSearch
            placeholder="请选择域"
            notFoundContent={isLoading ? <Spin size="small" /> : null}
            filterOption={false}
            onSearch={handleSearch}
            options={options}
            value={value}
            onChange={handleChange}
            style={{ minWidth: 200, ...style }}
        />
    );
}
