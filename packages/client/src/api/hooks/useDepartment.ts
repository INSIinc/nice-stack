import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { DataNode, DepartmentDto, ObjectType } from "@nicestack/common";
import { api } from "../trpc";
import { findQueryData, getCacheDataFromQuery } from "../utils";
import { CrudOperation, emitDataChange } from "../../event";
export function useDepartment() {
	const queryClient = useQueryClient();
	const queryKey = getQueryKey(api.department);
	const create = api.department.create.useMutation({
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey });
			emitDataChange(ObjectType.DEPARTMENT, result as any, CrudOperation.CREATED)
		},
	});

	const update = api.department.update.useMutation({
		onSuccess: (result) => {
			
			queryClient.invalidateQueries({ queryKey });
			emitDataChange(ObjectType.DEPARTMENT, result as any, CrudOperation.UPDATED)
		},
	});

	const softDeleteByIds = api.department.softDeleteByIds.useMutation({
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey });
			emitDataChange(ObjectType.DEPARTMENT, result as any, CrudOperation.DELETED)
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
					hasChildren: department.hasChildren,
					children: department.hasChildren
						? buildTree(data, department.id)
						: undefined,
					data: department,
				};
				return node;
			});
	};

	// const getTreeData = () => {
	// 	const uniqueData: DepartmentDto[] = getCacheDataFromQuery(
	// 		queryClient,
	// 		api.department
	// 	);
	// 	const treeData: DataNode[] = buildTree(uniqueData);
	// 	return treeData;
	// };
	// const getTreeData = () => {
	// 	const cacheArray = queryClient.getQueriesData({
	// 		queryKey: getQueryKey(api.department.getChildren),
	// 	});
	// 	const data: DepartmentDto[] = cacheArray
	// 		.flatMap((cache) => cache.slice(1))
	// 		.flat()
	// 		.filter((item) => item !== undefined) as any;
	// 	const uniqueDataMap = new Map<string, DepartmentDto>();

	// 	data?.forEach((item) => {
	// 		if (item && item.id) {
	// 			uniqueDataMap.set(item.id, item);
	// 		}
	// 	});
	// 	// Convert the Map back to an array
	// 	const uniqueData: DepartmentDto[] = Array.from(uniqueDataMap.values());
	// 	const treeData: DataNode[] = buildTree(uniqueData);
	// 	return treeData;
	// };
	const getDept = <T = DepartmentDto>(key: string) => {
		return findQueryData<T>(queryClient, api.department, key);
	};
	return {
		softDeleteByIds,
		update,
		create,
		// getTreeData,
		getDept
	};
}
