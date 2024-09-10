import { getQueryKey } from "@trpc/react-query";
import { api } from "../utils/trpc"; // Adjust path as necessary
import { useQueryClient } from "@tanstack/react-query";
import { RoleMapSchema, z } from "@nicestack/common";
export function useRoleMap() {
	const queryClient = useQueryClient();
	const queryKey = getQueryKey(api.rolemap);

	const create = api.rolemap.setRoleForObject.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
		},
	});
	const createManyObjects = api.rolemap.createManyObjects.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
		},
	});
	const update = api.rolemap.update.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
		},
	});
	const batchDelete = api.rolemap.batchDelete.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
		},
	});
	
	return {
		create,
		update,
		createManyObjects,
		batchDelete,
		
	};
}
