/**
 * 合并两个对象，仅当第二个对象的属性值不为null或undefined时进行覆盖
 * 采用函数式编程风格，避免副作用，提升代码可读性和可维护性
 * 
 * @param obj1 基础对象，其属性将被保留
 * @param obj2 覆盖对象，仅非空属性会覆盖基础对象的对应属性
 * @returns 合并后的新对象，原始对象不会被修改
 */
export function mergeIfDefined(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>
): Record<string, unknown> {
  // 使用reduce替代forEach，避免显式声明新对象，提升代码简洁性
  return Object.entries(obj2).reduce((acc, [key, value]) => {
    // 使用nullish coalescing operator简化条件判断
    if (value != null) {
      acc[key] = value;
    }
    return acc;
  }, { ...obj1 }); // 使用对象展开运算符创建新对象，确保原始对象不被修改
}
