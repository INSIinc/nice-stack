import { Staff } from "@prisma/client";
import { DataNode } from "./type";
export function findNodeByKey(
    nodes: DataNode[],
    targetKey: string
): DataNode | null {
    let result: DataNode | null = null;

    for (const node of nodes) {
        if (node.key === targetKey) {
            return node;
        }

        if (node.children && node.children.length > 0) {
            result = findNodeByKey(node.children, targetKey);
            if (result) {
                return result;
            }
        }
    }

    return result;
}
export function findStaffById(
    nodes: DataNode[],
    staffId: string
): Staff | null {
    for (const node of nodes) {
        // 在当前节点的staffs数组中查找
        const foundStaff = node?.data?.staffs.find(
            (staff: Staff) => staff.id === staffId
        );
        if (foundStaff) {
            return foundStaff;
        }

        // 如果当前节点的staffs数组中没有找到，则递归在子节点中查找
        if (node.children) {
            const foundInChildren = findStaffById(node.children, staffId);
            if (foundInChildren) {
                return foundInChildren;
            }
        }
    }

    // 如果在所有节点及其子节点中都没有找到，返回null
    return null;
}
interface MappingConfig {
    titleField?: string;
    keyField?: string;
    valueField?: string;
    hasChildrenField?: string; // Optional, in case the structure has nested items
    childrenField?: string;
}

export function mapToDataNodes(
    inputArray: any[],
    config: MappingConfig = {}
): DataNode[] {
    const {
        titleField = "title",
        keyField = "key",
        valueField = "value",
        hasChildrenField = "hasChildren",
        childrenField = "children"
    } = config;

    return inputArray.map((item) => {
        const hasChildren = item[hasChildrenField] || false;
        const children = item[childrenField]
        return {
            title: item[titleField] || "",
            key: item[keyField] || "",
            value: item[valueField] || null,
            data: item,
            children: children
                ? mapToDataNodes(children, { titleField, keyField, valueField, hasChildrenField, childrenField })
                : undefined,
            hasChildren
        };
    });
}

/**
 * 合并两个数组并去重。
 *
 * 该函数将两个输入数组的元素合并为一个数组，
 * 并确保结果数组中没有重复的元素。元素的顺序根据它们首次出现的顺序保留。
 *
 * @template T - 输入数组中元素的类型。
 * @param {T[]} array1 - 要合并的第一个数组。
 * @param {T[]} array2 - 要合并的第二个数组。
 * @returns {T[]} 包含来自两个输入数组的唯一元素的新数组。
 *
 * @example
 * const array1 = [1, 2, 3, 4];
 * const array2 = [3, 4, 5, 6];
 * const result = mergeAndDeduplicate(array1, array2);
 * console.log(result); // 输出: [1, 2, 3, 4, 5, 6]
 */
export function mergeAndDeduplicate<T = string>(array1: T[], array2: T[]): T[] {
    const set = new Set([...array1, ...array2]);
    return Array.from(set);
}

