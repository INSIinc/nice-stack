import { api } from "../trpc";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { Prisma } from "packages/common/dist";

export function useMessage() {
    const queryClient = useQueryClient();
    const queryKey = getQueryKey(api.message);
    const create:any = api.message.create.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return {
        create
    };
}