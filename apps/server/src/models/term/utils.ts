import { TreeDataNode } from '@nicestack/common';

export function formatToTermTreeData(term: any): TreeDataNode {
  return {
    id: term.id,
    key: term.id,
    value: term.id,
    title: term.name,
    order: term.order,
    pId: term.parentId,
    isLeaf: !Boolean(term.children?.length),
  };
}
export function mapToTermSimpleTree(term: any): TreeDataNode {
  return {
    id: term.id,
    key: term.id,
    value: term.id,
    title: term.name,
    order: term.order,
    pId: term.parentId,
    isLeaf: !Boolean(term.children?.length),
  };
}
