import React, { useEffect, useState } from "react";
import { Button, Empty, Tree } from "antd";

import {
	BranchesOutlined,
	DownOutlined,
	NodeIndexOutlined,
	PlusOutlined,
} from "@ant-design/icons";
import { DataNode } from "@nicestack/common";
import { useDepartment } from "@web/src/hooks/useDepartment";
import DepartmentDrawer from "./department-drawer";
import DepartmentImportDrawer from "./department-import-drawer";

export default function DepartmentList() {
	const [customTreeData, setCustomTreeData] = useState<DataNode[]>([]);
	const { treeData, addFetchParentId, update, deleteDepartment } =
		useDepartment();

	useEffect(() => {
		if (treeData) {
			const processedTreeData = processTreeData(treeData);
			setCustomTreeData(processedTreeData);
		}
	}, [treeData]);

	const renderTitle = (node: DataNode) => (
		<div className="flex items-center justify-between w-full">
			<span
				className={`font-semibold mr-2 ${node.data.isDomain ? "text-blue-500" : ""}`}>
				{node.data.isDomain && <BranchesOutlined className="mr-2" />}
				{node.title}
			</span>
			<div className="flex items-center gap-2">
				<DepartmentImportDrawer
					title="导入子节点"
					type="primary"
					size="small"
					parentId={node.data.id}
					ghost></DepartmentImportDrawer>

				<DepartmentDrawer
					ghost
					type="primary"
					size="small"
					icon={<PlusOutlined />}
					title="子节点"
					parentId={node.key}
				/>
				<DepartmentDrawer data={node.data} title="编辑" size="small" />

				<Button
					size="small"
					danger
					onClick={async () => {
						await deleteDepartment.mutateAsync({
							id: node.data.id,
						});
					}}>
					删除
				</Button>
			</div>
		</div>
	);

	const processTreeData = (nodes: DataNode[]): DataNode[] => {
		return nodes.map((node) => ({
			...node,
			title: renderTitle(node),
			children:
				node.children && node.children.length > 0
					? processTreeData(node.children)
					: [],
		}));
	};

	const onLoadData = async ({ key }: any) => {
		console.log(key);
		addFetchParentId(key);
	};

	const onExpand = (
		expandedKeys: React.Key[],
		{ expanded, node }: { expanded: boolean; node: any }
	) => {
		if (expanded) {
			addFetchParentId(node.key);
		}
	};

	const onDrop = async (info: any) => {
		console.log(info);

		const dropKey = info.node.key;
		const dragKey = info.dragNode.key;

		const dropPos = info.node.pos.split("-");
		const dropPosition =
			info.dropPosition - Number(dropPos[dropPos.length - 1]);
		console.log(dropPosition);

		const loop = (
			data: DataNode[],
			key: React.Key,
			callback: (node: DataNode, i: number, data: DataNode[]) => void
		) => {
			for (let i = 0; i < data.length; i++) {
				if (data[i].key === key) {
					return callback(data[i], i, data);
				}
				if (data[i].children) {
					loop(data[i].children!, key, callback);
				}
			}
		};

		const data = [...customTreeData];
		let dragObj: DataNode | undefined;
		loop(data, dragKey, (item, index, arr) => {
			arr.splice(index, 1);
			dragObj = item;
		});

		let parentNodeId: any = null;
		let siblings: DataNode[] = [];

		if (!info.dropToGap) {
			loop(data, dropKey, (item) => {
				item.children = item.children || [];
				item.children.unshift(dragObj!);
				parentNodeId = item.key;
				siblings = item.children;
			});
		} else if (
			(info.node.children || []).length > 0 &&
			info.node.expanded &&
			dropPosition === 1
		) {
			loop(data, dropKey, (item) => {
				item.children = item.children || [];
				item.children.unshift(dragObj!);
				parentNodeId = item.key;
				siblings = item.children;
			});
		} else {
			let ar: DataNode[] = [];
			let i: number = 0;
			loop(data, dropKey, (item, index, arr) => {
				ar = arr;
				i = index;
			});

			if (dropPosition === -1) {
				ar.splice(i, 0, dragObj!);
			} else {
				ar.splice(i + 1, 0, dragObj!);
			}

			parentNodeId = ar[0].data.parentId || null;
			siblings = ar;
		}

		setCustomTreeData(data);

		const { id } = dragObj!.data;
		console.log(JSON.parse(JSON.stringify(siblings)));

		const updatePromises = siblings.map((sibling, idx) => {
			return update.mutateAsync({
				id: sibling.data.id,
				order: idx,
				parentId: parentNodeId,
			});
		});

		await Promise.all(updatePromises);
		console.log(
			`Updated node ${id} and its siblings with new order and parentId ${parentNodeId}`
		);
	};

	const onDragEnter = () => { };

	return (
		<div className="flex flex-col gap-4 flex-grow">
			<div className="flex items-center gap-4">
				<DepartmentDrawer title="新建单位" type="primary" />
				<DepartmentImportDrawer
					ghost
					title="导入单位"
					type="primary"></DepartmentImportDrawer>
			</div>
			{customTreeData.length > 0 ? (
				<Tree
					style={{ minWidth: 400 }}
					loadData={onLoadData}
					treeData={customTreeData}
					draggable
					blockNode
					onDragEnter={onDragEnter}
					onDrop={onDrop}
					showLine={{ showLeafIcon: false }}
					switcherIcon={<DownOutlined />}
					onExpand={onExpand}
				/>
			) : (
				<Empty></Empty>
			)}
		</div>
	);
}
