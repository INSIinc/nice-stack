import { getQueryKey } from "@trpc/react-query";
import { api } from "../trpc"; // Adjust path as necessary
import { useQueryClient } from "@tanstack/react-query";
import { CrudOperation, emitDataChange, EventBus } from "../../event";
import { ObjectType } from "@nicestack/common";
export function useRoleMap() {
	const queryClient = useQueryClient();
	const queryKey = getQueryKey(api.rolemap);

	const create = api.rolemap.setRoleForObject.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
		},
	});
	const setRoleForObjects = api.rolemap.setRoleForObjects.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
		},
	});
	const addRoleForObjects = api.rolemap.addRoleForObjects.useMutation({
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey });
			emitDataChange(ObjectType.ROLE_MAP, result as any, CrudOperation.CREATED)
		},
	});
	const update = api.rolemap.update.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
		},
	});
	const deleteMany = api.rolemap.deleteMany.useMutation({
		onSuccess: (result) => {
		
			queryClient.invalidateQueries({ queryKey });
			emitDataChange(ObjectType.ROLE_MAP, result as any, CrudOperation.DELETED)
			
		},
	});

	return {
		create,
		update,
		setRoleForObjects,
		deleteMany,
		addRoleForObjects
	};
}
