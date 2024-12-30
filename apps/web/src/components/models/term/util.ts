import { TreeDataNode } from "@nicestack/common"
export const treeVisitor = (
    data: TreeDataNode[],
    key: React.Key,
    callback: (node: TreeDataNode, i: number, data: TreeDataNode[]) => void
) => {
    for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
            return callback(data[i], i, data);
        }
        if (data[i].children) {
            treeVisitor(data[i].children!, key, callback);
        }
    }
};