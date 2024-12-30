/**
 * 风险与任务评估工具模块
 * 
 * 本模块提供了一系列用于评估风险等级、任务紧急程度和综合问题级别的工具函数。
 * 主要用于项目管理、风险评估等场景，帮助用户量化分析各类风险因素。
 * 
 * 版本历史：
 * - v1.0.0 初始版本，包含基础风险评估功能
 * - v1.1.0 新增任务紧急程度评估功能
 * - v1.2.0 添加综合问题级别评估功能
 */

import dayjs from "dayjs";

/**
 * 计算风险等级
 * 
 * 根据概率和严重性的乘积来评估风险等级，采用线性分段评估方法。
 * 
 * @param probability 风险发生概率，范围0-100
 * @param severity 风险严重程度，范围0-100
 * @returns 风险等级，1-4级，4级为最高风险
 * 
 * 算法复杂度：O(1)
 * 空间复杂度：O(1)
 */
export function getRiskLevel(probability: number, severity: number) {
  // 计算风险值
  const riskValue = probability * severity;
  
  // 分段评估风险等级
  if (riskValue > 70) {
    return 4;
  } else if (riskValue > 42) {
    return 3;
  } else if (riskValue > 21) {
    return 2;
  }
  return 1;
}

/**
 * 计算任务紧急程度评分
 * 
 * 根据截止日期与当前日期的差值来评估任务紧急程度。
 * 采用分段评分机制，距离截止日期越近，评分越高。
 * 
 * @param deadline 任务截止日期，支持字符串、Date对象或空值
 * @returns 紧急程度评分，0-100分，100分为最紧急
 * 
 * 算法复杂度：O(1)
 * 空间复杂度：O(1)
 */
export function getDeadlineScore(deadline: string | Date | null | undefined) {
  // 处理空值情况
  if (!deadline) {
    return 0;
  }
  
  // 计算距离截止日期的天数
  const deadlineDays = dayjs().diff(dayjs(deadline), "day");
  
  // 初始化基础评分
  let deadlineScore = 25;
  
  // 根据天数范围调整评分
  if (deadlineDays > 365) {
    deadlineScore = 100;
  } else if (deadlineDays > 90) {
    deadlineScore = 75;
  } else if (deadlineDays > 30) {
    deadlineScore = 50;
  }
  
  return deadlineScore;
}

/**
 * 计算综合问题级别
 * 
 * 综合考虑概率、严重性、影响程度、成本和截止日期等因素，
 * 采用加权平均算法评估问题级别。
 * 
 * @param probability 问题发生概率，范围0-100
 * @param severity 问题严重程度，范围0-100
 * @param impact 问题影响范围，范围0-100
 * @param cost 问题解决成本，范围0-100
 * @param deadline 问题解决截止日期
 * @returns 问题级别，0-4级，4级为最严重问题
 * 
 * 算法复杂度：O(1)
 * 空间复杂度：O(1)
 */
export function getTroubleLevel(
  probability: number,
  severity: number,
  impact: number,
  cost: number,
  deadline: string | Date
) {
  // 计算距离截止日期的天数
  const deadlineDays = dayjs().diff(dayjs(deadline), "day");
  
  // 初始化紧急程度评分
  let deadlineScore = 25;
  
  // 根据天数范围调整评分
  if (deadlineDays > 365) {
    deadlineScore = 100;
  } else if (deadlineDays > 90) {
    deadlineScore = 75;
  } else if (deadlineDays > 30) {
    deadlineScore = 50;
  }
  
  // 计算加权总分
  let total =
    0.257 * probability +
    0.325 * severity +
    0.269 * impact +
    0.084 * deadlineScore +
    0.065 * cost;
  
  // 根据总分评估问题级别
  if (total > 90) {
    return 4;
  } else if (total > 60) {
    return 3;
  } else if (total > 30) {
    return 2;
  } else if (probability * severity * impact * cost !== 1) {
    return 1;
  } else {
    return 0;
  }
}
