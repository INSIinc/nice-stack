import { getQueryKey } from "@trpc/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { DataNode, ObjectType, TermDto } from "@nicestack/common";
import { api } from "../trpc";
import { findQueryData } from "../utils";
import { CrudOperation, emitDataChange } from "../../event";

export function useTerm() {
	const queryClient = useQueryClient();
	const queryKey = getQueryKey(api.term);
	const create = api.term.create.useMutation({
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey });
			emitDataChange(ObjectType.TERM, result as any, CrudOperation.CREATED)
		},
	});
	const upsertTags = api.term.upsertTags.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });

		},
	});


	const update = api.term.update.useMutation({
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey });
			emitDataChange(ObjectType.TERM, result as any, CrudOperation.UPDATED)
		},
	});

	const softDeleteByIds = api.term.softDeleteByIds.useMutation({
		onSuccess: (result, variables) => {
			queryClient.invalidateQueries({ queryKey });
		},
	});
	const buildTree = (
		data: TermDto[],
		parentId: string | null = null
	): DataNode[] => {
		return data
			.filter((term) => term.parentId === parentId)
			.sort((a, b) => a.order - b.order)
			.map((term) => {
				const node: DataNode = {
					title: term.name,
					key: term.id,
					value: term.id,
					hasChildren: !term.hasChildren,
					children: term.hasChildren
						? buildTree(data, term.id)
						: undefined,
					data: term,
				};
				return node;
			});
	};

	const getTerm = (key: string) => {
		return findQueryData<TermDto>(queryClient, api.term, key);
	};
	return {
		create,

		update,
		softDeleteByIds,
		getTerm,
		upsertTags,

	};
}
