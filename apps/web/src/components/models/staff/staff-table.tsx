import React, { useContext, useMemo, useEffect, useState } from "react";
import { DeleteOutlined, HolderOutlined } from "@ant-design/icons";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Table, Space, Divider, Typography } from "antd";
import type { TableColumnsType } from "antd";
import { Staff } from "@nicestack/common";
import { useStaff } from "@web/src/hooks/useStaff";
import { api } from "@web/src/utils/trpc";
import { TableRowSelection } from "antd/es/table/interface";
import DepartmentSelect from "../department/department-select";
import DomainSelect from "../domain/domain-select";
import StaffDrawer from "./staff-drawer";
import StaffImportDrawer from "./staff-import-drawer";


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
			style={{ cursor: "move" }}
			ref={setActivatorNodeRef}
			{...listeners}
		/>
	);
};

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
	"data-row-key": string;
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
	} = useSortable({ id: props["data-row-key"] });
	const style: React.CSSProperties = {
		...props.style,
		transform: CSS.Translate.toString(transform),
		transition,
		...(isDragging ? { position: "relative", zIndex: 10 } : {}),
	};
	const contextValue = useMemo<RowContextProps>(
		() => ({ setActivatorNodeRef, listeners }),
		[setActivatorNodeRef, listeners]
	);
	return (
		<RowContext.Provider value={contextValue}>
			<tr {...props} ref={setNodeRef} style={style} {...attributes} />
		</RowContext.Provider>
	);
};

const StaffTable: React.FC = () => {
	const [dataSource, setDataSource] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [domainId, setDomainId] = useState<string>();
	const [deptId, setDeptId] = useState<string>();
	const { data, isLoading } = api.staff.paginate.useQuery({
		page: currentPage,
		pageSize,
		domainId,
		deptId,
	});

	const [selectedIds, setSelectedRowKeys] = useState<string[]>([]);
	const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
		setSelectedRowKeys(newSelectedRowKeys as string[]);
	};
	const { batchDelete, update } = useStaff();
	const rowSelection: TableRowSelection<Staff> = {
		selectedRowKeys: selectedIds,
		onChange: onSelectChange,
	};
	useEffect(() => {
		if (data) {
			console.log(data.items);
			setDataSource(data.items);
		}
	}, [data]);

	const onDragEnd = ({ active, over }: DragEndEvent) => {
		if (active.id !== over?.id) {
			setDataSource((prevState) => {
				const activeIndex = prevState.findIndex(
					(record) => record.id === active?.id
				);
				const overIndex = prevState.findIndex(
					(record) => record.id === over?.id
				);
				const newItems = arrayMove(prevState, activeIndex, overIndex);
				handleUpdateOrder(JSON.parse(JSON.stringify(newItems)));
				return newItems;
			});
		}
	};

	const columns: TableColumnsType<Staff> = [
		{
			key: "sort",
			align: "center",
			width: 80,
			render: () => <DragHandle />,
		},
		{ title: "名称", dataIndex: "name", render: (text) => text },
		{ title: "手机号", dataIndex: "phoneNumber", key: "phoneNumber" },
		{
			title: "所属域",
			key: "domain.name",
			render: (_, record: any) => record.domain?.name,
		},
		{
			title: "单位",
			key: "department.name",
			render: (_, record: any) => record.department?.name,
		},
		{
			title: "操作",
			render: (_, record) => (
				<Space size="middle">
					<StaffDrawer title="编辑" data={record}></StaffDrawer>
				</Space>
			),
		},
	];

	const handleDelete = async () => {
		if (selectedIds.length > 0) {
			await batchDelete.mutateAsync({ ids: selectedIds });
		}
	};

	const handleUpdateOrder = async (newItems: Staff[]) => {
		// Create a deep copy of newItems
		const itemsCopy = JSON.parse(JSON.stringify(newItems));

		const orderedItems = itemsCopy.sort((a, b) => a.order - b.order);

		await Promise.all(
			orderedItems.map((item, index) => {
				if (item.order !== newItems[index].order) {
					return update.mutateAsync({
						id: newItems[index].id,
						order: item.order,
					});
				}
			})
		);
	};

	return (
		<div className="flex flex-col space-y-4">
			<div className="flex items-center ">
				<DomainSelect onChange={setDomainId}></DomainSelect>
				<Divider type="vertical"></Divider>
				<DepartmentSelect
					rootId={domainId}
					onChange={setDeptId as any}></DepartmentSelect>
				<Divider type="vertical"></Divider>

				<StaffImportDrawer
					className="mr-2"
					title="导入人员"
					ghost
					domainId={domainId}
					type="primary"></StaffImportDrawer>
				<StaffDrawer
					domainId={domainId}
					deptId={deptId}
					type="primary"
					title="新建人员"></StaffDrawer>
				<Divider type="vertical"></Divider>
				<Button
					onClick={handleDelete}
					disabled={selectedIds.length === 0}
					danger
					ghost
					icon={<DeleteOutlined></DeleteOutlined>}>
					删除
				</Button>

				{/* Display total number of staff */}
				<Divider type="vertical"></Divider>
			</div>
			<Typography.Text type="secondary">
				共查询到{data?.totalCount}条记录
			</Typography.Text>
			<DndContext
				modifiers={[restrictToVerticalAxis]}
				onDragEnd={onDragEnd}>
				<SortableContext
					items={dataSource.map((i) => i.id)}
					strategy={verticalListSortingStrategy}>
					<Table
						rowKey="id"
						pagination={{
							current: currentPage,
							pageSize,
							total: data?.totalCount,
							onChange: (page, pageSize) => {
								setCurrentPage(page);
								setPageSize(pageSize);
							},
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

export default StaffTable;
