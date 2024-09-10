import { getQueryKey } from "@trpc/react-query";
import { api } from "../utils/trpc"; // Adjust path as necessary
import { useQueryClient } from "@tanstack/react-query";
export function useStaff() {
    const queryClient = useQueryClient();
    const queryKey = getQueryKey(api.staff);

    const create = api.staff.create.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });


    const update = api.staff.update.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
    const batchDelete = api.staff.batchDelete.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })

    return {
        create,
        update,
        batchDelete
    };
}
