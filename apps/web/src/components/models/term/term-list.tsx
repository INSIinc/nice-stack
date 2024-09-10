import React, { useEffect, useState } from "react";
import { Empty, Tree, Button, message, TreeProps } from "antd";
import { PlusOutlined, DownOutlined } from "@ant-design/icons";
import { useTerm } from "@web/src/hooks/useTerm";
import { api } from "@web/src/utils/trpc";

import DomainSelect from "../domain/domain-select";
import TaxonomySelect from "../taxonomy/taxonomy-select";
import TermDrawer from "./term-drawer";
import TermImportDrawer from "./term-import-drawer";
import { DataNode } from "@nicestack/common";

export default function TermList() {
	const [customTreeData, setCustomTreeData] = useState<DataNode[]>([]);
	const [checkedTermIds, setCheckedTermIds] = useState<string[]>([]);
	const {
		treeData,
		update,
		batchDelete,
		taxonomyId,
		setTaxonomyId,
		domainId,
		setDomainId,
		addFetchParentId,
	} = useTerm();
	const { data: taxonomies } = api.taxonomy.getAll.useQuery();
	useEffect(() => {
		if (treeData && taxonomyId) {
			const processedTreeData = processTreeData(treeData).filter(
				(node) => node.data.taxonomyId === taxonomyId
			);
			console.log(treeData);
			console.log(processedTreeData);
			setCustomTreeData(processedTreeData);
		}
	}, [treeData, taxonomyId]);

	useEffect(() => {
		if (taxonomies && taxonomies.length > 0) {
			setTaxonomyId(taxonomies[0].id);
		}
	}, [taxonomies]);

	const renderTitle = (node: DataNode) => (
		<div className="flex items-center justify-between w-full">
			<span className={`font-semibold mr-2 `}>{node.title}</span>
			<div className="flex items-center gap-2">
				<TermDrawer
					domainId={domainId}
					taxonomyId={taxonomyId}
					ghost
					type="primary"
					size="small"
					icon={<PlusOutlined />}
					title="子节点"
					parentId={node.key}
				/>

				<TermDrawer
					taxonomyId={taxonomyId}
					data={node.data}
					title="编辑"
					size="small"
				/>
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

	const onDragEnter = () => { };

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

	const onExpand = (
		expandedKeys: React.Key[],
		{ expanded, node }: { expanded: boolean; node: any }
	) => {
		if (expanded) {
			addFetchParentId(node.key);
		}
	};

	const onCheck: TreeProps["onCheck"] = (checkedKeysValue: any) => {
		console.log("onCheck", checkedKeysValue);
		setCheckedTermIds(checkedKeysValue.checked);
	};

	const handleBatchDelete = async () => {
		try {
			await batchDelete.mutateAsync({ ids: checkedTermIds });
			setCheckedTermIds([]);
			message.success("成功删除所选术语");
		} catch (error) {
			message.error("删除失败");
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-4">
				<DomainSelect showAll onChange={setDomainId}></DomainSelect>
				<TaxonomySelect
					onChange={(value) => setTaxonomyId(value)}
					defaultValue={taxonomyId}
					width={200}
				/>

				<TermImportDrawer
					disabled={!taxonomyId}
					domainId={domainId}
					title="导入术语"
					type="primary"
					taxonomyId={taxonomyId}
				/>
				<TermDrawer
					disabled={!taxonomyId}
					domainId={domainId}
					title="新建术语"
					type="primary"
					taxonomyId={taxonomyId}
				/>
				<Button
					danger
					disabled={checkedTermIds.length === 0}
					onClick={handleBatchDelete}>
					删除
				</Button>
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
					onExpand={onExpand}
					onCheck={onCheck}
					checkable
					checkStrictly
					showLine={{ showLeafIcon: false }}
					switcherIcon={<DownOutlined />}
				/>
			) : (
				<Empty />
			)}
		</div>
	);
}
