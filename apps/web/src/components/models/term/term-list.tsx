import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Empty, Tree, Button, message, TreeProps } from "antd";
import {
	DeleteOutlined,
	DownOutlined,
	EditFilled,
	EllipsisOutlined,
	ImportOutlined,
	PlusOutlined,
} from "@ant-design/icons";
import { CrudOperation, emitDataChange, useTerm } from "@nicestack/client";
import { ObjectType, Term, TreeDataNode } from "@nicestack/common";
import DepartmentSelect from "../department/department-select";
import { TermEditorContext } from "./term-editor";
import { useAuth } from "@web/src/providers/auth-provider";
import { api } from "@nicestack/client"
import { Menu, MenuItem } from "../../presentation/dropdown-menu";
import AgServerTable from "../../presentation/ag-server-table";

import { CustomCellRendererProps } from "ag-grid-react";
import { ColDef, SortDirection } from "@ag-grid-community/core";

const OpreationRenderer = ({ props }: { props: CustomCellRendererProps }) => {
	const { setEditId, setTermModalOpen, setImportModalOpen, setParentId } =
		useContext(TermEditorContext);
	const { softDeleteByIds } = useTerm();
	return (
		<Menu
			node={
				<EllipsisOutlined className=" hover:bg-textHover p-1 rounded" />
			}>
			<MenuItem
				label="导入子节点"
				icon={<ImportOutlined></ImportOutlined>}
				onClick={() => {
					setParentId(props?.data?.id);

					// setEditId(data?.id)
					setImportModalOpen(true);
				}}></MenuItem>
			<MenuItem
				label="添加子节点"
				icon={<PlusOutlined></PlusOutlined>}
				onClick={() => {
					setParentId(props?.data?.id)
					// setEditId(data?.id)
					setTermModalOpen(true);
				}}></MenuItem>
			<MenuItem
				label="编辑"
				icon={<EditFilled></EditFilled>}
				onClick={() => {
					setEditId(props?.data?.id);
					setTermModalOpen(true);
				}}></MenuItem>

			<MenuItem
				label="移除"
				onClick={() => {
					softDeleteByIds.mutateAsync({
						ids: [props?.data?.id],
					}, {
						onSettled: () => {
							message.success("删除成功");
							emitDataChange(ObjectType.TERM, props.data as any, CrudOperation.DELETED)
						},
					});
				}}
				icon={<DeleteOutlined></DeleteOutlined>}></MenuItem>
		</Menu>
	);
};

export default function TermList() {
	const {
		domainId,
		setDomainId,
		taxonomyId,
		canManageAnyTerm,
		setTermModalOpen,
		setImportModalOpen,
	} = useContext(TermEditorContext);
	const { user } = useAuth();
	useEffect(() => {
		if (user) {
			setDomainId(user.domainId);
		}
	}, [user]);
	const [params, setParams] = useState({ parentId: null, domainId: null, taxonomyId: null });
	useEffect(() => {
		if (taxonomyId) {
			setParams((prev) => ({ ...prev, taxonomyId }))
		}
		if (domainId) {
			setParams((prev) => ({ ...prev, domainId }))
		} else {
			setParams((prev) => ({ ...prev, domainId: null }))
		}
	}, [taxonomyId, domainId])
	const columnDefs = useMemo<ColDef[]>(() => {
		return [
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
		headerName: "术语名",
		field: "name",
		filter: "agTextColumnFilter",
	}), []);

	const getServerSideGroupKey = useCallback((item) => item.id, []);
	const isServerSideGroup = useCallback((item) => item.has_children, []);

	return (
		<div className="flex flex-col  w-full">
			<div className=" justify-between flex items-center gap-4 border-b p-2">
				<span className=" text-secondary">分类项列表</span>
				<div className=" flex items-center gap-4">
					<DepartmentSelect
						disabled={!canManageAnyTerm}
						className="w-48"
						domain={true}
						value={domainId}
						onChange={(value) =>
							setDomainId(value as string)
						}></DepartmentSelect>

					<Button
						type="primary"
						icon={<ImportOutlined />}
						onClick={() => {
							setImportModalOpen(true);
						}}
						ghost>
						导入数据
					</Button>
					<Button
						icon={<PlusOutlined></PlusOutlined>}
						type="primary"
						onClick={() => {
							setTermModalOpen(true);
						}}>
						新建分类
					</Button>
				</div>
			</div>
			<AgServerTable
				height="calc(100vh - 49px - 48px - 49px)"
				columnDefs={columnDefs}
				objectType={ObjectType.TERM}
				treeData={true}
				params={params}  // 使用 state 中的 params
				getServerSideGroupKey={getServerSideGroupKey}
				isServerSideGroup={isServerSideGroup}
				autoGroupColumnDef={autoGroupColumnDef}
			></AgServerTable>
			{/* <div
				className="p-2"
				style={{ height: "calc(100vh - 49px - 48px - 49px)" }}>
				
				{treeData.length > 0 ? (
					<Tree
						style={{ minWidth: 400 }}
						treeData={treeData}
						draggable
						blockNode
						onDragEnter={onDragEnter}
						onDrop={async (info) => {
							try {
								console.log(
									"Drag and Drop operation initiated with info:",
									info
								);

								const dropKey = info.node.key;
								const dragKey = info.dragNode.key;
								const dropPos = info.node.pos.split("-");
								const dropPosition =
									info.dropPosition -
									Number(dropPos[dropPos.length - 1]);

								console.debug(
									`Calculated drop position: ${dropPosition}`
								);

								const data = [...treeData];
								let dragObj;
								console.debug(
									"Starting tree visitor to find and remove drag object."
								);

								treeVisitor(
									data,
									dragKey,
									(item, index, arr) => {
										arr.splice(index, 1);
										dragObj = item;
										console.debug(
											`Removed dragged node: `,
											dragObj
										);
									}
								);

								let parentNodeId = null;
								let siblings = [];

								if (!info.dropToGap) {
									console.debug(
										"Drop onto node action detected."
									);
									treeVisitor(data, dropKey, (item) => {
										item.children = item.children || [];
										item.children.unshift(dragObj);
										parentNodeId = item.key;
										siblings = item.children;
										console.debug(
											`Added drag node as a child of node: ${parentNodeId}`
										);
									});
								} else if (
									(info.node.children || []).length > 0 &&
									info.node.expanded &&
									dropPosition === 1
								) {
									console.debug(
										"Drop after expanded node with children detected."
									);
									treeVisitor(data, dropKey, (item) => {
										item.children = item.children || [];
										item.children.unshift(dragObj);
										parentNodeId = item.key;
										siblings = item.children;
										console.debug(
											`Added drag node as a child of node: ${parentNodeId}`
										);
									});
								} else {
									console.debug("Drop in gap detected.");
									let ar = [];
									let i = 0;
									treeVisitor(
										data,
										dropKey,
										(item, index, arr) => {
											ar = arr;
											i = index;
										}
									);

									if (dropPosition === -1) {
										ar.splice(i, 0, dragObj);
									} else {
										ar.splice(i + 1, 0, dragObj);
									}
									parentNodeId = ar[0].parentId || null;
									siblings = ar;
									console.debug(
										`Inserted drag node at position: ${i}, under parentNodeId: ${parentNodeId}`
									);
								}

								setTreeData(data);
								console.debug(
									"Tree data updated with new structure."
								);
								console.log(siblings);
								const { id } = dragObj;
								const updatePromises = siblings.map(
									(sibling, idx) => {
										return update.mutateAsync({
											id: sibling.id,
											order: idx,
											parentId: parentNodeId,
										});
									}
								);

								console.debug(
									"Starting update of siblings' order and parentId."
								);
								await Promise.all(updatePromises);
								console.log(
									`Updated node ${id} and its siblings with new order and parentId ${parentNodeId}`
								);
							} catch (error) {
								console.error(
									"An error occurred during the drag and drop operation:",
									error
								);
							}
						}}
						checkable
						checkStrictly
						titleRender={titleRender}
						showLine={{ showLeafIcon: false }}
						switcherIcon={<DownOutlined />}
					/>
				) : (
					<div className="pt-32">
						<Empty />
					</div>
				)}
			</div> */}
		</div>
	);
}
