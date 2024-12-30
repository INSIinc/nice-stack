import { getQueryKey } from "@trpc/react-query";
import { api } from "../trpc"; // Adjust path as necessary
import { useQueryClient } from "@tanstack/react-query";

export function useTaxonomy() {
    const queryClient = useQueryClient();
    const queryKey = getQueryKey(api.taxonomy);

    const create = api.taxonomy.create.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const findById = (id: string) => {
        return api.taxonomy.findById.useQuery({ id });
    };

    const update = api.taxonomy.update.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const deleteItem = api.taxonomy.delete.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
    const deleteMany = api.taxonomy.deleteMany.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })
    const paginate = (page: number, pageSize: number) => {
        return api.taxonomy.paginate.useQuery({ page, pageSize });
    };

    return {
        create,
        findById,
        update,
        deleteItem,
        paginate,
        deleteMany
    };
}
