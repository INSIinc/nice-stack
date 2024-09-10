import { useState, useEffect, useRef } from 'react';

/**
 * 自定义 Hook: 等待 state 变为指定值
 * @param {T} value - 要监听的 state 值。
 * @param {T} targetValue - 目标值，当 state 变为该值时 promise 结束。
 * @return {Promise<void>} - 返回一个 Promise，当 state 变为 targetValue 时 resolve。
 */
function useAwaitState<T>(value: T, targetValue: T): Promise<void> {
    const [resolved, setResolved] = useState(false);
    const resolveRef = useRef<() => void>();

    useEffect(() => {
        if (value === targetValue) {
            setResolved(true);
            if (resolveRef.current) {
                resolveRef.current();
            }
        }
    }, [value, targetValue]);

    return new Promise((resolve) => {
        if (resolved) {
            resolve();
        } else {
            resolveRef.current = resolve;
        }
    });
}

export default useAwaitState;
