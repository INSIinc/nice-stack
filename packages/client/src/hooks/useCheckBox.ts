/**
 * 自定义钩子：用于管理复选框的选择状态
 * @template T - 复选框项的类型
 * @param {UseCheckBoxOptions<T>} options - 配置选项
 * @returns {UseCheckBoxReturn<T>} - 返回包含选择状态和相关操作的对象
 */
import { useEffect, useMemo, useState } from "react";

/**
 * 复选框配置选项类型
 * @template T - 复选框项的类型
 */
type UseCheckBoxOptions<T> = {
    /**
     * 选择模式，支持 "single"（单选）或 "multiple"（多选）
     */
    mode?: "single" | "multiple";
    /**
     * 最大选择数量，仅在多选模式下有效
     */
    maxSelection?: number;
    /**
     * 初始选中的项
     */
    initialSelected?: T[];
};

/**
 * 复选框钩子返回值类型
 * @template T - 复选框项的类型
 */
type UseCheckBoxReturn<T> = {
    /**
     * 当前选中的项
     */
    selected: T[];
    /**
     * 设置选中项的函数
     */
    setSelected: React.Dispatch<React.SetStateAction<T[]>>;
    /**
     * 选择指定项的函数
     */
    select: (item: T) => void;
    /**
     * 取消选择指定项的函数
     */
    deselect: (item: T) => void;
    /**
     * 切换指定项选择状态的函数
     */
    toggle: (item: T) => void;
    /**
     * 清空所有选中项的函数
     */
    clear: () => void;
    /**
     * 判断指定项是否被选中的函数
     */
    isSelected: (item: T) => boolean;
    /**
     * 当前是否没有任何项被选中
     */
    isEmpty: boolean;
};

/**
 * 自定义钩子：用于管理复选框的选择状态
 * @template T - 复选框项的类型
 * @param {UseCheckBoxOptions<T>} options - 配置选项
 * @returns {UseCheckBoxReturn<T>} - 返回包含选择状态和相关操作的对象
 */
export function useCheckBox<T>(options: UseCheckBoxOptions<T> = {}): UseCheckBoxReturn<T> {
    // 使用 useState 初始化选中项，默认为空数组或传入的初始选中项
    const [selected, setSelected] = useState<T[]>(options.initialSelected ?? []);
    // 根据配置选项确定选择模式，默认为多选，如果 maxSelection 为 1 则为单选
    const mode = options.mode ?? (options.maxSelection === 1 ? "single" : "multiple");

    /**
     * 选择指定项的函数
     * @param {T} item - 要选择的项
     */
    const select = (item: T) => {
        // 如果是单选模式，直接替换当前选中项
        if (mode === "single") {
            setSelected([item]);
        } 
        // 如果是多选模式且当前项未被选中，则添加到选中项列表中
        else if (!selected.includes(item)) {
            // 如果未设置最大选择数量或当前选中项数量未达到最大值，则添加
            if (options.maxSelection === undefined || selected.length < options.maxSelection) {
                setSelected((prev) => [...prev, item]);
            }
        }
    };

    /**
     * 取消选择指定项的函数
     * @param {T} item - 要取消选择的项
     */
    const deselect = (item: T) => {
        // 过滤掉当前项，更新选中项列表
        setSelected((prev) => prev.filter((i) => i !== item));
    };

    /**
     * 切换指定项选择状态的函数
     * @param {T} item - 要切换选择状态的项
     */
    const toggle = (item: T) => {
        // 如果当前项已被选中，则取消选择，否则选择
        if (selected.includes(item)) {
            deselect(item);
        } else {
            select(item);
        }
    };

    /**
     * 清空所有选中项的函数
     */
    const clear = () => {
        // 将选中项列表设置为空数组
        setSelected([]);
    };

    /**
     * 判断指定项是否被选中的函数
     * @param {T} item - 要判断的项
     * @returns {boolean} - 如果项被选中则返回 true，否则返回 false
     */
    const isSelected = (item: T) => {
        // 检查当前项是否在选中项列表中
        return selected.includes(item);
    };

    /**
     * 判断当前是否没有任何项被选中
     */
    const isEmpty = useMemo(() => {
        // 检查选中项列表是否为空
        return selected.length === 0;
    }, [selected]);

    // 返回包含选中状态和相关操作的对象
    return {
        selected,
        select,
        deselect,
        toggle,
        clear,
        isSelected,
        isEmpty,
        setSelected,
    };
}
