import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { api } from "../utils/trpc";
import { DataNode, DepartmentDto } from "@nicestack/common";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { findQueryData } from "../utils/general";

export function useDepartment() {
	const queryClient = useQueryClient();
	const queryKey = getQueryKey(api.department);
	const [fetchParentIds, setFetchParentIds] = useState<string[]>([null]);
	const queries = api.useQueries((t) => {
		return fetchParentIds.map((id) =>
			t.department.getChildren({ parentId: id })
		);
	});
	const addFetchParentId = (newId: string) => {
		setFetchParentIds((prevIds) => {
			// Check if the newId already exists in the array
			if (!prevIds.includes(newId)) {
				// If not, add it to the array
				return [...prevIds, newId];
			}
			// Otherwise, return the array as is
			return prevIds;
		});
	};
	const [treeData, setTreeData] = useState<DataNode[]>([]);
	const queriesFetched = useMemo(() => {
		return queries.every((query) => query.isFetched);
	}, [queries]);
	const queriesFetching = useMemo(() => {
		return queries.some((query) => query.isFetching);
	}, [queries]);
	useEffect(() => {
		if (queriesFetched) {
			const rawTreeData = getTreeData();
			setTreeData(rawTreeData);
		}
	}, [queriesFetching]);

	const create = api.department.create.useMutation({
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey });
		},
	});

	const findById = (id: string) => {
		return api.department.getDepartmentDetails.useQuery({ deptId: id });
	};

	const update = api.department.update.useMutation({
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey });
		},
	});

	const deleteDepartment = api.department.delete.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
		},
	});
	const buildTree = (
		data: DepartmentDto[],
		parentId: string | null = null
	): DataNode[] => {
		return data
			.filter((department) => department.parentId === parentId)
			.sort((a, b) => a.order - b.order)
			.map((department) => {
				const node: DataNode = {
					title: department.name,
					key: department.id,
					value: department.id,
					isLeaf: !department.hasChildren,
					children: department.hasChildren
						? buildTree(data, department.id)
						: undefined,
					data: department,
				};
				return node;
			});
	};

	const getTreeData = () => {
		const cacheArray = queryClient.getQueriesData({
			queryKey: getQueryKey(api.department.getChildren),
		});
		const data: DepartmentDto[] = cacheArray
			.flatMap((cache) => cache.slice(1))
			.flat()
			.filter((item) => item !== undefined) as any;
		const uniqueDataMap = new Map<string, DepartmentDto>();

		data.forEach((item) => {
			if (item && item.id) {
				uniqueDataMap.set(item.id, item);
			}
		});
		// Convert the Map back to an array
		const uniqueData: DepartmentDto[] = Array.from(uniqueDataMap.values());
		const treeData: DataNode[] = buildTree(uniqueData);
		return treeData;
	};
	const getDept = (key: string) => {
		return findQueryData<DepartmentDto>(queryClient, api.department, key);
	};
	return {
		deleteDepartment,
		update,
		findById,
		create,
		getTreeData,
		addFetchParentId,
		fetchParentIds,
		treeData,
		getDept,
	};
}
