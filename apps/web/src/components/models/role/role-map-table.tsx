import React, { useMemo, useEffect, useState } from "react";
import { Button, Table, Space, Divider, Segmented } from "antd";
import type { TableColumnsType } from "antd";
import { ObjectType, Staff } from "@nicestack/common";
import { TableRowSelection } from "antd/es/table/interface";
import { useRoleMap } from "@web/src/hooks/useRoleMap";
import { api } from "@web/src/utils/trpc";
import DepartmentSelect from "../department/department-select";
import DomainSelect from "../domain/domain-select";
import RoleMapDrawer from "./rolemap-drawer";
interface RoleMapTableProps {
	roleId?: string | undefined;
	roleName?: string | undefined;
}
const RoleMapTable: React.FC<RoleMapTableProps> = ({ roleId, roleName }) => {
	const [type, setType] = useState<"dept" | "staff">("dept");

	const [domainId, setDomainId] = useState<string>();
	const [deptId, setDeptId] = useState<string>();
	const { data: roleDetail } = api.rolemap.getRoleMapDetail.useQuery({
		roleId,
		domainId: domainId ? domainId : null,
	});

	const staffIdsList = useMemo(() => {
		if (roleDetail) {
			return roleDetail.staffIds;
		}
		return [];
	}, [roleDetail]);
	const deptIdsList = useMemo(() => {
		if (roleDetail) {
			return roleDetail.deptIds;
		}
		return [];
	}, [roleDetail]);
	api.useQueries((t) => {
		return deptIdsList?.map((id) =>
			t.department.getDepartmentDetails({ deptId: id })
		);
	});
	const [dataSource, setDataSource] = useState<any[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const { data: staffData, isLoading: isStaffLoading } =
		api.staff.paginate.useQuery({
			page: currentPage,
			pageSize,
			ids: staffIdsList,
			// domainId,
			deptId,
		});
	const { data: deptData, isLoading: isDeptLoading } =
		api.department.paginate.useQuery({
			page: currentPage,
			pageSize,
			ids: deptIdsList,
		});
	useEffect(() => {
		if (staffData && type === "staff") {
			console.log(staffData.items);
			setDataSource(staffData.items);
		}
	}, [staffData, type]);
	useEffect(() => {
		if (deptData && type === "dept") {
			console.log(deptData.items);
			setDataSource(
				deptData.items.map((item) => {
					return {
						id: item?.id,
						name: item?.name,
						isDomain: item?.isDomain,
						parentName: item?.parent?.name,
						staffCount: item?.deptStaffs?.length,
					};
				})
			);
		}
	}, [deptData, type]);
	const deptColumns: TableColumnsType = [
		{ title: "名称", dataIndex: "name", render: (text) => text },

		{
			title: "父单位",
			key: "parent",
			render: (_, record) => record.parentName,
		},
		{
			title: "单位人数",
			key: "parent",
			render: (_, record) => record.staffCount,
		},
		{
			title: "是否域",
			key: "isDomain",
			render: (_, record) => (record.isDomain ? "是" : "否"),
		},
		{
			title: "操作",
			render: (_, record) => (
				<Space size="middle">
					<Button
						danger
						onClick={async () => {
							console.log(domainId);

							await createManyObjects.mutateAsync({
								domainId: domainId ? domainId : null,
								objectType: ObjectType.DEPARTMENT,
								objectIds: deptIdsList.filter(
									(id) => id !== record.id
								),
								roleId,
							});
						}}>
						删除
					</Button>
				</Space>
			),
		},
	];
	const { createManyObjects } = useRoleMap();
	const staffColumns: TableColumnsType<Staff> = [
		{ title: "名称", dataIndex: "name", render: (text) => text },
		{
			title: "手机号",
			dataIndex: "phoneNumber",
			key: "phoneNumber",
		},
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
					<Button
						danger
						onClick={async () => {
							console.log(domainId);
							console.log(record);
							await createManyObjects.mutateAsync({
								domainId: domainId ? domainId : null,
								objectType: ObjectType.STAFF,
								objectIds: staffIdsList.filter(
									(id) => id !== record.id
								),
								roleId,
							});
						}}>
						删除
					</Button>
				</Space>
			),
		},
	];
	const [selectedIds, setSelectedRowKeys] = useState<string[]>([]);
	const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
		setSelectedRowKeys(newSelectedRowKeys as string[]);
	};
	const rowSelection: TableRowSelection<Staff> = {
		selectedRowKeys: selectedIds,
		onChange: onSelectChange,
	};
	return (
		<div className="flex flex-col space-y-4">
			<div className="font-bold text-xl">{roleName}</div>
			<div>
				<Segmented
					options={[
						{ label: "单位", value: "dept" },
						{ label: "人员", value: "staff" },
					]}
					onChange={setType}
				/>

				<Divider type="vertical"></Divider>
				<DomainSelect onChange={setDomainId}></DomainSelect>
				{type === "staff" && (
					<>
						<Divider type="vertical"></Divider>
						<DepartmentSelect
							width={"auto"}
							rootId={domainId}
							onChange={setDeptId as any}></DepartmentSelect>
					</>
				)}
				<Divider type="vertical"></Divider>
				{roleId && (
					<RoleMapDrawer
						roleType={type}
						domainId={domainId}
						roleId={roleId}
						title="分配权限"></RoleMapDrawer>
				)}
			</div>

			<div className="flex flex-col space-y-4">
				{type === "staff" && (
					<Table
						rowKey="id"
						columns={staffColumns}
						dataSource={dataSource}
						loading={isStaffLoading}
						rowSelection={rowSelection}
						pagination={{
							current: currentPage,
							pageSize,
							total: staffData?.totalCount,
							onChange: (page, pageSize) => {
								setCurrentPage(page);
								setPageSize(pageSize);
							},
							hideOnSinglePage: true,
						}}
						locale={{
							emptyText: "暂无人员", // 自定义数据为空时的显示内容
						}}
					/>
				)}
				{type === "dept" && (
					<Table
						rowKey="id"
						columns={deptColumns}
						dataSource={dataSource}
						loading={isDeptLoading}
						// rowSelection={rowSelection}
						pagination={{
							current: currentPage,
							pageSize,
							total: deptData?.totalCount,
							onChange: (page, pageSize) => {
								setCurrentPage(page);
								setPageSize(pageSize);
							},
							hideOnSinglePage: true,
						}}
						locale={{
							emptyText: "暂无单位", // 自定义数据为空时的显示内容
						}}
					/>
				)}
			</div>
		</div>
	);
};

export default RoleMapTable;
