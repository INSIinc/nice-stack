import { Icon } from "@nicestack/iconer"; import {
	DeleteOutlined,
	EditFilled,
	EllipsisOutlined,
} from "@ant-design/icons";
import { ICellRendererParams } from "@ag-grid-community/core";
import {
	ColDef,
	ValueGetterParams,
} from "@ag-grid-community/core";
import { ObjectType, StaffRowModel } from "@nicestack/common";
import { Menu, MenuItem } from "../../presentation/dropdown-menu";
import AgServerTable from "../../presentation/ag-server-table";
import IdCard from "../../presentation/id-card";
import { useContext, useEffect, useState } from "react";
import { StaffEditorContext } from "./staff-editor";
import PhoneBook from "../../presentation/phone-book";
import { SortDirection } from "ag-grid-community";
import { CrudOperation, emitDataChange, useStaff } from "@nicestack/client";
import { message, Tag } from "antd";
import { CustomCellRendererProps } from "@ag-grid-community/react";
const OpreationRenderer = ({ props }: { props: ICellRendererParams }) => {
	const { setEditId, setModalOpen } = useContext(StaffEditorContext);
	const { softDeleteByIds } = useStaff()
	if (props?.data?.id)
		return (
			<div>
				<Menu
					node={
						<EllipsisOutlined className=" hover:bg-textHover p-1 rounded" />
					}>
					<MenuItem
						label="编辑"
						icon={<EditFilled></EditFilled>}
						onClick={() => {
							setEditId(props?.data?.id);
							setModalOpen(true);
						}}></MenuItem>
					<MenuItem
						label="移除"
						onClick={() => {
							softDeleteByIds.mutateAsync({
								ids: [props?.data?.id],
							}, {
								onSettled: () => {
									message.success("删除成功");
									emitDataChange(ObjectType.STAFF, props.data as any, CrudOperation.DELETED)
								},
							});
						}}
						icon={<DeleteOutlined></DeleteOutlined>}></MenuItem>
				</Menu>
			</div>
		);
};
const StaffList = ({
	domainId,
	height = "calc(100vh - 48px - 49px)",
}: {
	domainId?: string;
	height?: string | number;
}) => {
	const { canManageAnyStaff } = useContext(StaffEditorContext);
	const [params, setParams] = useState({ domainId: null });
	useEffect(() => {

		if (domainId) {
			setParams((prev) => ({ ...prev, domainId }))
		} else {
			setParams((prev) => ({ ...prev, domainId: null }))
		}
	}, [domainId])
	const columnDefs: ColDef[] = [
		canManageAnyStaff && {
			headerName: "所属域",
			field: "domain.name",
			sortable: true,
			valueGetter: (params) => {
				return params.data?.domain_name;
			},
			filter: "agTextColumnFilter",
		},
		{
			headerName: "所属单位",
			field: "dept.name",
			valueGetter: (params: ValueGetterParams) => {
				return params.data?.dept_name;
			},
			cellRenderer: (params) => {

				return (
					params.value || (
						<span className="text-tertiary">未录入所属单位</span>
					)
				);
			},
			sortable: true,

			filter: "agTextColumnFilter",
			enableRowGroup: true,
			maxWidth: 200,
		},
		{
			field: "order",
			hide: true,
			sort: "asc" as SortDirection
		},
		{
			headerName: "帐号",
			field: "username",
			cellRenderer: (params) => {
				if (params?.data?.id)
					return (
						params.value || (
							<span className="text-tertiary">未录入帐号</span>
						)
					);
			},
			sortable: true,
			rowDrag: true,
			filter: "agTextColumnFilter",
			maxWidth: 300,
		},
		{
			headerName: "姓名",
			field: "showname",
			cellRenderer: (params) => {
				if (params?.data?.id)
					return (
						params.value || (
							<span className="text-tertiary">未录入姓名</span>
						)
					);
			},
			sortable: true,

			filter: "agTextColumnFilter",
			maxWidth: 300,
		},
		{
			headerName: "证件号",
			field: "officer_id",
			sortable: true,
			filter: "agTextColumnFilter",
			cellRenderer: (params) => {
				const { data }: { data: StaffRowModel } = params;
				if (params?.data?.id)
					return <IdCard id={data?.officer_id}></IdCard>;
			},
		},
		{
			headerName: "手机号",
			field: "phone_number",
			sortable: true,
			filter: "agTextColumnFilter",
			cellRenderer: (params) => {
				const { data }: { data: StaffRowModel } = params;
				if (params?.data?.id)
					return <PhoneBook phoneNumber={data?.phone_number}></PhoneBook>;
			},
		},
		{
			headerName: "是否启用",
			field: "enabled",
			sortable: true,
			enableRowGroup: true,
			cellRenderer: (props: CustomCellRendererProps) => {

				return <Tag color={props?.data?.enabled ? "success" : "error"}>{props?.data?.enabled ? "已启用" : "已禁用"}</Tag>
			},
		},
		{
			headerName: "操作",
			sortable: true,

			cellRenderer: (props) => (
				<OpreationRenderer props={props}></OpreationRenderer>
			), // 指定 cellRenderer
			maxWidth: 80,
		},
	].filter(Boolean);

	return (
		<AgServerTable
			height={height}
			rowHeight={60}
			columnDefs={columnDefs}
			objectType={ObjectType.STAFF}
			params={params}
			rowGroupPanelShow="always"
		/>
	);
};

export default StaffList;
