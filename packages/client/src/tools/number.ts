/**
 * 数值边界处理工具模块
 * 
 * 版本历史：
 * 1.0.0 - 初始版本，提供基础的数值边界处理功能
 * 
 * 使用场景：
 * 本模块适用于需要对数值进行边界限制的场景，如：
 * - 确保数值在指定范围内
 * - 防止数值溢出或下溢
 * - 数据校验和规范化处理
 */

/**
 * 上界限制函数
 * 
 * 功能描述：
 * 当输入数值大于最大值时，返回最大值；否则返回原数值
 * 
 * @param n - 待处理的数值
 * @param max - 允许的最大值
 * @returns 限制后的数值
 * 
 * 算法复杂度：
 * 时间复杂度：O(1)
 * 空间复杂度：O(1)
 */
export function upperBound(n: number, max: number) {
  return n > max ? max : n;
}

/**
 * 下界限制函数
 * 
 * 功能描述：
 * 当输入数值小于最小值时，返回最小值；否则返回原数值
 * 
 * @param n - 待处理的数值
 * @param min - 允许的最小值
 * @returns 限制后的数值
 * 
 * 算法复杂度：
 * 时间复杂度：O(1)
 * 空间复杂度：O(1)
 */
export function lowerBound(n: number, min: number) {
  return n < min ? min : n;
}

/**
 * 双边界限制函数
 * 
 * 功能描述：
 * 将数值限制在指定的最小值和最大值之间
 * 
 * 设计模式解析：
 * 本函数采用组合模式，通过调用lowerBound和upperBound实现双重限制
 * 
 * @param n - 待处理的数值
 * @param min - 允许的最小值
 * @param max - 允许的最大值
 * @returns 限制后的数值
 * 
 * 使用示例：
 * bound(5, 0, 10) // 返回5
 * bound(-1, 0, 10) // 返回0
 * bound(11, 0, 10) // 返回10
 * 
 * 算法复杂度：
 * 时间复杂度：O(1)
 * 空间复杂度：O(1)
 */
export function bound(n: number, min: number, max: number) {
  // 先应用下界限制，再应用上界限制
  return upperBound(lowerBound(n, min), max);
}
