// 引入 React，提供 Hooks 和类型支持
import React from 'react';

/**
 * @function useTimeout
 * @description 自定义 React Hook，用于管理定时器操作的高级工具函数
 * 
 * @template CbParams 回调函数的泛型参数类型，提供灵活的类型支持
 * @param {(params?: CbParams) => void} cb 定时器触发后执行的回调函数
 * @param {number} [delayMs=0] 定时器延迟时间，默认为 0 毫秒
 * 
 * @returns {Object} 返回包含定时器控制方法的对象
 * - startTimer: 启动定时器方法
 * - clearTimer: 清除定时器方法
 * - isActive: 标识定时器是否处于活动状态
 * 
 * @technical-design 
 * - 使用 useRef 管理定时器引用，避免重复创建和内存泄漏
 * - 通过 useCallback 优化函数引用，减少不必要的重渲染
 * - 支持动态配置延迟时间和回调函数
 */
function useTimeout<CbParams>(cb: (params?: CbParams) => void, delayMs = 0) {
    // 创建持久化的定时器引用，生命周期跟随组件
    const ref = React.useRef<NodeJS.Timeout>();

    /**
     * @method clearTimer
     * @description 清除当前活动的定时器
     * @complexity O(1) 常数级时间复杂度
     */
    const clearTimer = React.useCallback(() => {
        // 检查定时器是否存在，避免重复清除
        if (ref.current) {
            // 使用系统 clearTimeout 方法终止定时器
            clearTimeout(ref.current);
            // 重置引用为 undefined，表示定时器已清除
            ref.current = undefined;
        }
    }, []);

    /**
     * @method startTimer
     * @description 启动新的定时器，并确保之前的定时器被清除
     * @complexity O(1) 常数级时间复杂度
     */
    const startTimer = React.useCallback(() => {
        // 启动新定时器前先清除已存在的定时器，防止资源竞争
        clearTimer();
        
        // 创建新的定时器，指定延迟和回调行为
        ref.current = setTimeout(() => {
            // 执行传入的回调函数
            cb();

            // 定时器执行完毕后，重置引用
            ref.current = undefined;
        }, delayMs);

    }, [clearTimer, delayMs, cb]);

    /**
     * @effect 组件卸载时自动清理定时器
     * @description 防止内存泄漏，确保组件销毁时定时器被正确清除
     */
    React.useEffect(() => () => clearTimer(), [clearTimer]);

    /**
     * @returns 返回包含定时器控制方法的对象
     * 提供灵活的定时器管理接口
     */
    return {
        startTimer,     // 启动定时器方法
        clearTimer,     // 清除定时器方法
        isActive: ref.current !== undefined  // 判断定时器是否活跃的状态标识
    };
}

export { useTimeout };