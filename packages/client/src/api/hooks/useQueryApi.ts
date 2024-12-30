import type { SkipToken } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import type {
    UseTRPCQueryOptions,
    UseTRPCQueryResult,
} from "@trpc/react-query/shared";
import type { DecoratedQuery } from "node_modules/@trpc/react-query/dist/createTRPCReact";

export const useQueryApi = <
    T extends DecoratedQuery<{
        input: any;
        output: any;
        transformer: any;
        errorShape: any;
    }>,
    U extends T extends DecoratedQuery<infer R> ? R : never,
>(
    query: T,
    input: U["input"] | SkipToken,
    opts?: UseTRPCQueryOptions<
        U["output"],
        U["input"],
        TRPCClientErrorLike<U["output"]>,
        U["output"]
    >,
): UseTRPCQueryResult<U["output"], TRPCClientErrorLike<U>> =>
    query.useQuery(input, opts);
