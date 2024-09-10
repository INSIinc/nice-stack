import React, { useContext, useMemo, useEffect, useState } from 'react';
import { DeleteOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Table, Space, Divider } from 'antd';
import type { TableColumnsType } from 'antd';
import { Taxonomy } from "@nicestack/common"
import { TableRowSelection } from 'antd/es/table/interface';
import { useTaxonomy } from '@web/src/hooks/useTaxonomy';
import { api } from '@web/src/utils/trpc';
import TaxonomyDrawer from './taxonomy-drawer';

interface RowContextProps {
    setActivatorNodeRef?: (element: HTMLElement | null) => void;
    listeners?: SyntheticListenerMap;
}

const RowContext = React.createContext<RowContextProps>({});

const DragHandle: React.FC = () => {
    const { setActivatorNodeRef, listeners } = useContext(RowContext);
    return (
        <Button
            type="text"
            size="small"
            icon={<HolderOutlined />}
            style={{ cursor: 'move' }}
            ref={setActivatorNodeRef}
            {...listeners}
        />
    );
};

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    'data-row-key': string;
}

const Row: React.FC<RowProps> = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props['data-row-key'] });

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Translate.toString(transform),
        transition,
        ...(isDragging ? { position: 'relative', zIndex: 10 } : {}),
    };

    const contextValue = useMemo<RowContextProps>(
        () => ({ setActivatorNodeRef, listeners }),
        [setActivatorNodeRef, listeners],
    );

    return (
        <RowContext.Provider value={contextValue}>
            <tr {...props} ref={setNodeRef} style={style} {...attributes} />
        </RowContext.Provider>
    );
};

const TaxonomyTable: React.FC = () => {
    const [dataSource, setDataSource] = useState<Taxonomy[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data, isLoading } = api.taxonomy.paginate.useQuery({ page: currentPage, pageSize });

    const [selectedIds, setSelectedRowKeys] = useState<string[]>([]);
    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys as string[]);
    };
    const { batchDelete, update } = useTaxonomy();
    const rowSelection: TableRowSelection<Taxonomy> = {
        selectedRowKeys: selectedIds,
        onChange: onSelectChange,
    };

    useEffect(() => {
        if (data) {
            setDataSource(data.items);
        }
    }, [data]);

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (active.id !== over?.id) {
            setDataSource((prevState) => {
                const activeIndex = prevState.findIndex((record) => record.id === active?.id);
                const overIndex = prevState.findIndex((record) => record.id === over?.id);
                const newItems = arrayMove(prevState, activeIndex, overIndex);
                handleUpdateOrder(JSON.parse(JSON.stringify(newItems)));
                return newItems;
            });
        }
    };

    const columns: TableColumnsType<Taxonomy> = [
        { key: 'sort', align: 'center', width: 80, render: () => <DragHandle /> },
        { title: '名称', dataIndex: 'name', render: (text) => text },
        // { title: '别名', dataIndex: 'slug', key: 'slug' },
        {
            title: '操作',
            render: (_, record) => (
                <Space size="middle">
                    <TaxonomyDrawer title='编辑' data={record}></TaxonomyDrawer>
                </Space>
            ),
        },
    ];

    const handleDelete = async () => {
        if (selectedIds.length > 0) {
            await batchDelete.mutateAsync({ ids: selectedIds });
        }
    };

    const handleUpdateOrder = async (newItems: Taxonomy[]) => {
        const orderedItems = newItems.sort((a, b) => a.order - b.order);
        await Promise.all(
            orderedItems.map((item, index) => {
                if (item.order !== newItems[index].order) {
                    return update.mutateAsync({ id: newItems[index].id, order: item.order });
                }
            })
        );
    };

    return (
        <div className='flex flex-col space-y-4'>
            <div>
                <TaxonomyDrawer title='新建分类法' type='primary' ></TaxonomyDrawer>
                <Divider type='vertical'></Divider>
                <Button onClick={handleDelete} disabled={selectedIds.length === 0} danger ghost icon={<DeleteOutlined></DeleteOutlined>}>删除</Button>
            </div>
            <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
                <SortableContext items={dataSource.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <Table
                        rowKey="id"
                        pagination={{
                            current: currentPage,
                            pageSize,
                            total: data?.totalCount,
                            onChange: (page, pageSize) => {
                                setCurrentPage(page);
                                setPageSize(pageSize);
                            }
                        }}
                        components={{ body: { row: Row } }}
                        columns={columns}
                        dataSource={dataSource}
                        loading={isLoading}
                        rowSelection={rowSelection}
                    />
                </SortableContext>
            </DndContext>
        </div>
    );
};

export default TaxonomyTable;
