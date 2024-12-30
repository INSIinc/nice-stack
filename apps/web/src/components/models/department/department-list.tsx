import React, { useMemo, useContext, useCallback, useState } from "react";
import { ObjectType } from "@nicestack/common"
import { ICellRendererParams, SortDirection } from "ag-grid-community";
import { ColDef } from "@ag-grid-community/core";
import AgServerTable from "../../presentation/ag-server-table";
import { DeleteOutlined, EditFilled, EllipsisOutlined, PlusOutlined } from "@ant-design/icons";
import { Menu, MenuItem } from "../../presentation/dropdown-menu";
import { DeptEditorContext } from "./dept-editor";
import { CustomCellRendererProps } from "ag-grid-react";
import { message, Tag } from "antd";
import { CrudOperation, emitDataChange, useDepartment } from "@nicestack/client";

export default function DepartmentList() {
	const { setEditId, setModalOpen, setParentId } = useContext(DeptEditorContext);
	// 将 params 转换为 state
	const [params, setParams] = useState({ parentId: null });
	const { softDeleteByIds } = useDepartment()
	const OpreationRenderer = ({ props }: { props: ICellRendererParams }) => {
		const handleEdit = () => {
			setEditId(props?.data?.id);
			setModalOpen(true);
		};
		const handleCreate = () => {
			setParentId(props.data?.id)
			setModalOpen(true);
		}
		return (
			<div>
				<Menu
					node={
						<EllipsisOutlined className=" hover:bg-textHover p-1 rounded" />
					}>
					<MenuItem
						label="添加子节点"
						icon={<PlusOutlined></PlusOutlined>}
						onClick={handleCreate}
					/>
					<MenuItem
						label="编辑"
						icon={<EditFilled />}
						onClick={handleEdit}
					/>
					<MenuItem
						label="移除"
						onClick={() => {
							softDeleteByIds.mutateAsync({
								ids: [props?.data?.id],
							}, {
								onSettled: () => {
									message.success("删除成功");
									emitDataChange(ObjectType.DEPARTMENT, props.data as any, CrudOperation.DELETED)
								},
							});
						}}
						icon={<DeleteOutlined></DeleteOutlined>}></MenuItem>
				</Menu>
			</div>
		);
	};

	const columnDefs = useMemo<ColDef[]>(() => {
		return [
			{
				headerName: "是否为域",
				field: "is_domain",
				cellRenderer: (props: CustomCellRendererProps) => {
					return <Tag color={props.value ? "cyan" : "blue"}>
						{props.value ? '域节点' : '普通节点'}
					</Tag>
				}
			},
			{
				field: "order",
				hide: true,
				sort: "asc" as SortDirection
			},
			{
				headerName: "操作",
				sortable: true,
				cellRenderer: (props: CustomCellRendererProps) => (
					<OpreationRenderer props={props} />
				),
				maxWidth: 80,
			},
		].filter(Boolean);
	}, []);

	const autoGroupColumnDef = useMemo(() => ({
		rowDrag: true,
		headerName: "单位名",
		field: "name",
		filter: "agTextColumnFilter",
	}), []);

	const getServerSideGroupKey = useCallback((item) => item.id, []);
	const isServerSideGroup = useCallback((item) => item.has_children, []);

	return (
		<AgServerTable
			height={"calc(100vh - 48px - 49px)"}
			columnDefs={columnDefs}
			objectType={ObjectType.DEPARTMENT}
			treeData={true}
			params={params}  // 使用 state 中的 params
			getServerSideGroupKey={getServerSideGroupKey}
			isServerSideGroup={isServerSideGroup}
			autoGroupColumnDef={autoGroupColumnDef}
		/>
	);
}
