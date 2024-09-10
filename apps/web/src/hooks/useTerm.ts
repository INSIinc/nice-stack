import { getQueryKey } from "@trpc/react-query";
import { api } from "../utils/trpc"; // Adjust path as necessary
import { useQueryClient } from "@tanstack/react-query";
import { DataNode, TermDto } from "@nicestack/common"
import { useEffect, useMemo, useState } from "react";
import { getCacheDataFromQuery } from "../utils/general";
export function useTerm() {
    const queryClient = useQueryClient();
    const queryKey = getQueryKey(api.term);
    const [fetchParentIds, setFetchParentIds] = useState<string[]>([null]);
    const [domainId, setDomainId] = useState<string>(undefined)
    const [taxonomyId, setTaxonomyId] = useState<string>(undefined)
    const queries = api.useQueries(t => {
        return fetchParentIds.map(id => t.term.getAllChildren({ parentId: id, domainId, taxonomyId }))
    })
    const addFetchParentId = (newId: string) => {
        setFetchParentIds((prevIds) => {
            // Check if the newId already exists in the array
            if (!prevIds.includes(newId)) {
                // If not, add it to the array
                return [...prevIds, newId];
            }
            // Otherwise, return the array as is
            return prevIds;
        });

    };
    const [treeData, setTreeData] = useState<DataNode[]>([]);
    const queriesFetching = useMemo(() => {
        return queries.some(query => query.isFetching)
    }, [queries])
    useEffect(() => {
        if (!queriesFetching) {
            const rawTreeData = getTreeData();
            setTreeData(rawTreeData);
        }
    }, [queriesFetching]);

    const create = api.term.create.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const findById = (id: string) => {
        return api.term.findById.useQuery({ id });
    };

    const update = api.term.update.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const deleteTerm = api.term.delete.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const batchDelete = api.term.batchDelete.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })
    const buildTree = (data: TermDto[], parentId: string | null = null): DataNode[] => {
        return data
            .filter(term => term.parentId === parentId).sort((a, b) => a.order - b.order)
            .map(term => {
                const node: DataNode = {
                    title: term.name,
                    key: term.id,
                    value: term.id,
                    isLeaf: !term.hasChildren,
                    children: term.hasChildren ? buildTree(data, term.id) : undefined,
                    data: term
                };
                return node;
            });
    };

    const getTreeData = () => {
        const uniqueData: any = getCacheDataFromQuery(queryClient, api.term, "id")
        console.log(uniqueData)
        const treeData: DataNode[] = buildTree(uniqueData);
        return treeData;
    };

    return {
        create,
        findById,
        update,
        deleteTerm,
        batchDelete,
        treeData,
        addFetchParentId,
        setDomainId,
        domainId,
        taxonomyId, setTaxonomyId
    };
}
