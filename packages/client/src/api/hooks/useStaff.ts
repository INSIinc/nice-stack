import { getQueryKey } from "@trpc/react-query";
import { api } from "../trpc"; // Adjust path as necessary
import { useQueryClient } from "@tanstack/react-query";
import { ObjectType, Staff } from "@nicestack/common";
import { findQueryData } from "../utils";
import { CrudOperation, emitDataChange } from "../../event";
export function useStaff() {
    const queryClient = useQueryClient();
    const queryKey = getQueryKey(api.staff);

    const create = api.staff.create.useMutation({
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey });
            emitDataChange(ObjectType.STAFF, result as any, CrudOperation.CREATED)
        },
    });
    const updateUserDomain = api.staff.updateUserDomain.useMutation({
        onSuccess: async (result) => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
    const update = api.staff.update.useMutation({
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey });
            emitDataChange(ObjectType.STAFF, result as any, CrudOperation.UPDATED)
        },
    });
	const softDeleteByIds = api.staff.softDeleteByIds.useMutation({
		onSuccess: (result, variables) => {
			queryClient.invalidateQueries({ queryKey });
		},
	});
    const getStaff = (key: string) => {
        return findQueryData<Staff>(queryClient, api.staff, key);
    };
    return {
        create,
        update,
        softDeleteByIds,
        getStaff,
        updateUserDomain
    };
}
