import { UserProfile, db, DeptSimpleTreeNode, TreeDataNode } from "@nicestack/common";

/**
 * 将部门数据映射为DeptSimpleTreeNode结构
 * @param department 部门数据对象
 * @returns 返回格式化后的DeptSimpleTreeNode对象
 * 数据结构说明:
 * - id: 部门唯一标识
 * - key: 部门唯一标识，通常用于React中的key属性
 * - value: 部门唯一标识，通常用于表单值
 * - title: 部门名称
 * - order: 部门排序值
 * - pId: 父部门ID，用于构建树形结构
 * - isLeaf: 是否为叶子节点，即该部门是否没有子部门
 * - hasStaff: 该部门是否包含员工
 */
export function mapToDeptSimpleTree(department: any): DeptSimpleTreeNode {
    return {
        id: department.id,
        key: department.id,
        value: department.id,
        title: department.name,
        order: department.order,
        pId: department.parentId,
        isLeaf: !Boolean(department.children?.length),
        hasStaff: department?.deptStaffs?.length > 0
    };
}

/**
 * 根据部门ID列表获取相关员工信息
 * @param ids 部门ID列表
 * @returns 返回与指定部门相关的员工ID列表
 * 算法说明:
 * - 使用数据库查询方法findMany，根据部门ID列表查询相关部门的员工信息
 * - 使用flatMap将查询结果扁平化，提取所有员工ID
 */
export async function getStaffsByDeptIds(ids: string[]) {
    const depts = await db.department.findMany({
        where: { id: { in: ids } },
        select: {
            deptStaffs: {
                select: { id: true }
            }
        },
    });
    return depts.flatMap((dept) => dept.deptStaffs);
}

/**
 * 提取唯一的员工ID列表
 * @param params 参数对象，包含部门ID列表、员工ID列表和员工信息
 * @returns 返回唯一的员工ID列表
 * 算法说明:
 * - 根据部门ID列表获取相关员工ID
 * - 将部门员工ID与传入的员工ID列表合并，并使用Set去重
 * - 如果传入了员工信息，则从结果中移除该员工的ID
 * - 最终返回去重后的员工ID列表
 */
export async function extractUniqueStaffIds(params: { deptIds?: string[], staffIds?: string[], staff?: UserProfile }): Promise<string[]> {
    const { deptIds, staff, staffIds } = params;
    const deptStaffs = await getStaffsByDeptIds(deptIds);
    const result = new Set(deptStaffs.map(item => item.id).concat(staffIds));
    if (staff) {
        result.delete(staff.id);
    }
    return Array.from(result);
}