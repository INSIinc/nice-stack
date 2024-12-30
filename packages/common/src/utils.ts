import { Staff } from "@prisma/client";
import { TermDto, TreeDataNode } from "./types";
export function findNodeByKey(
  nodes: TreeDataNode[],
  targetKey: string
): TreeDataNode | null {
  let result: TreeDataNode | null = null;
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
export const interpolateColor = (percent: number) => {
  let r, g;
  if (percent < 0.5) {
    // Transition from red to yellow
    r = 255;
    g = Math.floor(2 * percent * 255);
  } else {
    // Transition from yellow to green
    r = Math.floor(2 * (1 - percent) * 255);
    g = 255;
  }
  return `rgba(${r}, ${g}, 0, 0.4)`; // No blue component needed
};
export function findStaffById(
  nodes: TreeDataNode[],
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
export function getRandomTimeInterval(year: number): { startDate: Date; endDate: Date } {
  // Helper function to generate a random date within the given year
  function getRandomDate(year: number): Date {
    const start = new Date(year, 0, 1).getTime();
    const end = new Date(year + 1, 0, 1).getTime();
    return new Date(start + Math.random() * (end - start));
  }

  let startDate = getRandomDate(year);
  let endDate = getRandomDate(year);

  // Ensure the startDate is before endDate
  if (startDate > endDate) {
    [startDate, endDate] = [endDate, startDate];
  }

  return { startDate, endDate };
}
interface MappingConfig {
  titleField?: string;
  keyField?: string;
  valueField?: string;
  hasChildrenField?: string; // Optional, in case the structure has nested items
  childrenField?: string;
}
export function stringToColor(str: string): string {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;

    // Adjusting the value to avoid dark, gray or too light colors
    if (value < 100) {
      value += 100; // Avoids too dark colors
    }
    if (value > 200) {
      value -= 55;  // Avoids too light colors
    }

    // Ensure the color is not gray by adjusting R, G, B individually
    value = Math.floor((value + 255) / 2);

    color += ('00' + value.toString(16)).slice(-2);
  }

  return color;
}


export function mapToTreeDataNodes(
  inputArray: any[],
  config: MappingConfig = {}
): TreeDataNode[] {
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
        ? mapToTreeDataNodes(children, { titleField, keyField, valueField, hasChildrenField, childrenField })
        : undefined,
      hasChildren
    };
  });
}

export function arraysAreEqual<T = any>(arr1: T[] = [], arr2: T[] = []): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  return arr1.every((element, index) => element === arr2[index]);
}

export function mergeAndDeduplicate<T = string>(...arrays: T[][]): T[] {
  const set = new Set(arrays.flat());
  return Array.from(set);
}

export function arraysIntersect<T>(array1: T[], array2: T[]): boolean {
  const set = new Set(array1);
  for (const item of array2) {
    if (set.has(item)) {
      return true;
    }
  }
  return false;
}
export function calculatePercentage(part: number, whole: number) {
  if (whole === 0) {
    return 0;
  }
  const percentage = (part / whole) * 100;
  return percentage;
}
export function getRandomIntInRange(min: number, max: number): number {
  if (min > max) {
    [min, max] = [max, min];
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomBooleanNormalDist(mean: number = 0, stdDev: number = 1): boolean {
  // Generate two uniformly distributed values in the range (0, 1]
  const u1 = Math.random();
  const u2 = Math.random();

  // Apply the Box-Muller transform to get two independent standard normal random variables
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

  // Scale and shift to match the desired mean and standard deviation
  const result0 = z0 * stdDev + mean;
  const result1 = z1 * stdDev + mean;

  // Use one of the results to determine the boolean value
  return result0 >= 0;
}
export function decimalToPercentage(decimal: number): number {
  if (typeof decimal !== 'number') {
    throw new Error("Input must be a number.");
  }

  return Math.round(decimal * 100);
}
export function deduplicateObjectArray<T, K extends keyof T>(array: T[], key: K): T[] {
  const seen = new Set<T[K]>();
  return array.filter(item => {
    const val = item[key];
    if (seen.has(val)) {
      return false;
    }
    seen.add(val);
    return true;
  });
}
type Primitive = string | number | boolean | null | undefined;
export function removeEmptyOrZeroValues<T extends Record<string, Primitive>>(obj: T): Partial<T> {
  const result: Partial<T> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== null && value !== undefined && value !== '' && value !== 0) {
        result[key] = value;
      }
    }
  }

  return result
}

export function truncateString(content: string, maxLength: number) {
  return content.length > maxLength ? `${content.slice(0, maxLength)}...` : content;
};
export function getRandomElement<T>(arr: T[]): T {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}
export function getRandomElements<T>(arr: T[], count?: number): T[] {
  // If count is not provided, choose a random count between 1 and arr.length
  const effectiveCount = count ?? Math.floor(Math.random() * arr.length) + 1;
  const result: T[] = [];
  const usedIndices: Set<number> = new Set();

  while (result.length < effectiveCount && usedIndices.size < arr.length) {
    const randomIndex = Math.floor(Math.random() * arr.length);

    if (!usedIndices.has(randomIndex)) {
      result.push(arr[randomIndex]);
      usedIndices.add(randomIndex);
    }
  }

  return result;
}

export function getRandomChineseName(): string {
  const surnames = ["王", "李", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴"];
  const givenNames = [
    "伟", "芳", "娜", "敏", "静", "丽", "强", "磊", "军", "洋",
    "勇", "艳", "杰", "娟", "涛", "明", "霞", "秀英", "鹏"
  ];

  const randomSurnameIndex = Math.floor(Math.random() * surnames.length);
  const randomGivenNameIndex1 = Math.floor(Math.random() * givenNames.length);
  const randomGivenNameIndex2 = Math.floor(Math.random() * givenNames.length);

  const surname = surnames[randomSurnameIndex];
  const givenName = givenNames[randomGivenNameIndex1] + givenNames[randomGivenNameIndex2];


  return surname + givenName;
}
export function getRandomAvatarUrl(): string {
  const randomString = Math.random().toString(36).substring(7);
  return `https://robohash.org/${randomString}.png`;
}

export const getUniqueItems = <T>(items: T[], key?: keyof T) => {
  if (key === undefined) {
    // 当未提供键时，假设是纯数组进行去重
    return Array.from(new Set(items));
  } else {
    // 提供了键时，对对象数组进行去重
    return Array.from(
      new Map(items.map(item => [item[key] as unknown || null, item])).values()
    );
  }
};
export type Extractor<T, K extends keyof T> = (array: T[], key: K) => T[K][];



/**
 * 从对象数组中提取指定属性值组成新数组
 * @template T 源对象类型
 * @template K 属性键类型，必须是T的键名
 * @param {T[]} array 源对象数组
 * @param {K} key 要提取的属性键名
 * @returns {T[K][]} 提取出的属性值数组
 */
export const pluckProperty = <T, K extends keyof T>(array: T[], key: K): T[K][] => {
  // 使用map方法遍历数组，返回每个对象指定属性的值
  return array.map(item => item[key]);
};

/**
 * 将对象数组转换为以指定属性值为键的对象数组
 * @template T 源对象类型
 * @template K 属性键类型，必须是T的键名
 * @param {T[]} array 源对象数组
 * @param {K} key 要作为键的属性名
 * @returns {Array<Record<string, T>>} 转换后的对象数组
 */
export const mapPropertiesToObjects = <T, K extends keyof T>(array: T[], key: K): Array<Record<string, T>> => {
  // 使用map方法遍历数组，为每个对象创建一个新对象
  // 新对象以指定属性值为键，原对象为值
  return array.map(item => ({ [item[key] as string]: item }));
};

/**
 * 将数组映射为包含指定属性的对象数组
 * @template T 数组元素类型
 * @param {T[]} array 源数组
 * @param {string} key 要添加的属性名
 * @returns {Array<Record<string, T>>} 映射后的对象数组
 */
export const mapArrayToObjectArray = <T>(
  array: T[], 
  key: string = 'id'
): Array<Record<string, T>> => {
  return array.map(item => ({ [key]: item }));
};