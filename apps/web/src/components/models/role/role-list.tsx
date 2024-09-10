import { useRole } from "@web/src/hooks/useRole";
import { api } from "@web/src/utils/trpc";
import { TableColumnsType, Space, Button, Table } from "antd";
import { Role } from "packages/common/dist/cjs";
import { useState, useEffect } from "react";
import RoleDrawer from "./role-drawer";

interface RoleListProps {
	onChange?: (roleId: string, name?: string) => void;
}
const RoleList: React.FC<RoleListProps> = ({ onChange }) => {
	const [dataSource, setDataSource] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const { data, isLoading } = api.role.paginate.useQuery({
		page: currentPage,
		pageSize,
	});
	const [selectedRowId, setSelectedRowId] = useState(null);
	const { batchDelete } = useRole();

	useEffect(() => {
		if (data && data.items.length > 0) {
			console.log(data.items);
			setDataSource(data.items);
			if (!selectedRowId) {
				setSelectedRowId(data.items[0]?.id);
				if (onChange) {
					onChange(data.items[0].id, data.items[0].name);
				}
			}
		}
	}, [data]);

	const columns: TableColumnsType<Role> = [
		// { title: 'ID', dataIndex: 'id', width: 300, render: (text) => text },
		{ title: "名称", dataIndex: "name", render: (text) => text },
		{
			title: "操作",
			render: (_, record) => (
				<Space size="middle">
					<RoleDrawer title="编辑" data={record}></RoleDrawer>
					<Button
						danger
						onClick={async () => {
							await batchDelete.mutateAsync({ ids: [record.id] });
						}}>
						删除
					</Button>
				</Space>
			),
		},
	];

	return (
		<div className="flex flex-col space-y-4">
			<div>
				<RoleDrawer type="primary" title="新建角色"></RoleDrawer>
			</div>
			<Table
				rowKey="id"
				columns={columns}
				dataSource={dataSource}
				loading={isLoading}
				pagination={{
					current: currentPage,
					pageSize,
					total: data?.totalCount,
					onChange: (page, pageSize) => {
						setCurrentPage(page);
						setPageSize(pageSize);
					},
					hideOnSinglePage: true,
				}}
				onRow={(record) => ({
					onClick: () => {
						setSelectedRowId(record.id);
						if (onChange) {
							onChange(record.id, record.name);
						}
						// console.log("Selected Row ID:", record.id);
					},
					style: {
						backgroundColor:
							selectedRowId === record.id ? "#e6f7ff" : "",
						cursor: "pointer",
					},
				})}
				rowClassName={(record) =>
					record.id === selectedRowId ? "ant-table-row-selected" : ""
				}
				locale={{
					emptyText: "暂无角色", // 自定义数据为空时的显示内容
				}}
			/>
		</div>
	);
};

export default RoleList;
