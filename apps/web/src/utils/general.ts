import { QueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
export const handleDownload = (url: string | undefined) => {
    if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = url.split('/').pop() || '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * 根据查询客户端缓存生成唯一数据列表的函数。
 *
 * @template T - 数据类型
 * @param {QueryClient} client - 查询客户端实例
 * @param {any} trpcQueryKey - 用于获取查询键的参数
 * @param {string} uniqueField - 唯一字段的名称，默认为 'id'
 * @returns {T[]} - 返回唯一的数据列表
 */
export function getCacheDataFromQuery<T>(client: QueryClient, trpcQueryKey: any, uniqueField: string = 'id'): T[] {
    // 获取查询缓存数据
    const cacheData = client.getQueriesData({ queryKey: getQueryKey(trpcQueryKey) });
    // 提取并整理缓存数据
    const data = cacheData
        .flatMap(cache => cache.slice(1))
        .flat()
        .filter(item => item !== undefined) as T[];

    // 使用 Map 进行去重
    const uniqueDataMap = new Map<string, T>();
    data.forEach((item: T) => {
        if (item && item[uniqueField]) {
            uniqueDataMap.set(item[uniqueField], item);
        }
    });

    // 转换为数组返回唯一的数据列表
    return Array.from(uniqueDataMap.values());
}

/**
 * 查找唯一数据列表中的匹配对象。
 *
 * @template T - 数据类型
 * @param {T[]} uniqueData - 唯一数据列表
 * @param {string} key - 唯一字段的键值
 * @param {string} uniqueField - 唯一字段的名称，默认为 'id'
 * @returns {T | undefined} - 返回匹配的对象，如果没有找到则返回 undefined
 */
export function findDataByKey<T>(uniqueData: T[], key: string | number, uniqueField: string = 'id'): T | undefined {
    return uniqueData.find(item => item[uniqueField] === key);
}

/**
 * 综合使用生成唯一数据和查找数据的功能。
 *
 * @template T - 数据类型
 * @param {QueryClient} client - 查询客户端实例
 * @param {any} trpcQueryKey - 用于获取查询键的参数
 * @param {string} key - 唯一字段的键值
 * @param {string} uniqueField - 唯一字段的名称，默认为 'id'
 * @returns {T | undefined} - 返回匹配的对象，如果没有找到则返回 undefined
 */
export function findQueryData<T>(client: QueryClient, trpcQueryKey: any, key: string | number, uniqueField: string = 'id'): T | undefined {
    const uniqueData = getCacheDataFromQuery<T>(client, trpcQueryKey, uniqueField);
    return findDataByKey<T>(uniqueData, key, uniqueField);
}
