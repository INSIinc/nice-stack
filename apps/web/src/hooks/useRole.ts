import { getQueryKey } from "@trpc/react-query";
import { api } from "../utils/trpc"; // Adjust path as necessary
import { useQueryClient } from "@tanstack/react-query";

export function useRole() {
    const queryClient = useQueryClient();
    const queryKey = getQueryKey(api.role);

    const create = api.role.create.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });


    const update = api.role.update.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const batchDelete = api.role.batchDelete.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })
    const paginate = (page: number, pageSize: number) => {
        return api.role.paginate.useQuery({ page, pageSize });
    };

    return {
        create,
        update,
        paginate,
        batchDelete
    };
}
