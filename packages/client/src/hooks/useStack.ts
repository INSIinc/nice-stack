/**
 * 模块：useStack
 * 功能：实现一个基于React的栈（Stack）数据结构Hook
 * 作者：高级软件开发工程师
 * 版本：1.0.0
 * 使用场景：适用于需要在React组件中管理栈结构数据的场景，如撤销/重做操作、路由历史管理等
 */

import { Dispatch, SetStateAction, useMemo, useState } from "react";

/**
 * 接口：StackHook<T>
 * 职责：定义栈Hook的返回对象结构
 * 核心功能：提供栈的基本操作接口，包括入栈、出栈、查看栈顶元素等
 */
export interface StackHook<T> {
	stack: T[]; // 当前栈中的元素数组
	push: (item: T) => void; // 将元素压入栈顶
	pop: () => void; // 弹出栈顶元素
	popToItem: (item: T) => void; // 弹出栈中元素直到指定元素
	peek: () => T | undefined; // 查看栈顶元素
	isEmpty: boolean; // 判断栈是否为空
	clear: () => void; // 清空栈
	isOnlyDefaultItem: boolean; // 判断栈中是否仅包含默认元素
	setStack: Dispatch<SetStateAction<T[]>> // 直接设置栈内容
}

/**
 * 函数：useStack<T>
 * 职责：创建一个栈Hook实例
 * 核心功能：管理栈状态并提供相关操作方法
 * 设计模式：基于React的Hook模式，封装栈操作逻辑
 * 使用示例：
 * const { stack, push, pop } = useStack<number>();
 * push(1); // 栈：[1]
 * push(2); // 栈：[1, 2]
 * pop(); // 栈：[1]
 */
export function useStack<T>(defaultBottomItem?: T | null): StackHook<T> {
	// 初始化栈状态，支持设置默认底部元素
	const [stack, setStack] = useState<T[]>(
		!!defaultBottomItem ? [defaultBottomItem] : []
	);

	/**
	 * 方法：push
	 * 功能：将元素压入栈顶
	 * 输入参数：item - 要压入栈顶的元素
	 * 算法复杂度：O(1)
	 */
	const push = (item: T) => setStack((prevStack) => [...prevStack, item]);

	/**
	 * 方法：pop
	 * 功能：弹出栈顶元素
	 * 算法复杂度：O(1)
	 */
	const pop = () =>
		setStack((prevStack) =>
			prevStack.length > 0 ? prevStack.slice(0, -1) : prevStack
		);

	/**
	 * 方法：popToItem
	 * 功能：弹出栈中元素直到指定元素
	 * 输入参数：item - 目标元素
	 * 算法复杂度：O(n)，n为栈中元素数量
	 */
	const popToItem = (item: T) => {
		setStack((prevStack) => {
			const index = prevStack.lastIndexOf(item);
			return index >= 0 && index < prevStack.length - 1
				? prevStack.slice(0, index + 1)
				: prevStack;
		});
	};

	/**
	 * 方法：peek
	 * 功能：查看栈顶元素
	 * 返回值：栈顶元素，若栈为空则返回undefined
	 * 算法复杂度：O(1)
	 */
	const peek = (): T | undefined => stack[stack.length - 1];

	/**
	 * 属性：isEmpty
	 * 功能：判断栈是否为空
	 * 返回值：boolean，true表示栈为空
	 * 算法复杂度：O(1)
	 */
	const isEmpty = useMemo(() => {
		return stack.length === 0;
	}, [stack, defaultBottomItem]);

	/**
	 * 属性：isOnlyDefaultItem
	 * 功能：判断栈中是否仅包含默认元素
	 * 返回值：boolean，true表示栈中仅包含默认元素
	 * 算法复杂度：O(1)
	 */
	const isOnlyDefaultItem = useMemo(() => {
		if (defaultBottomItem !== undefined) {
			return stack.length === 1 && stack[0] === defaultBottomItem;
		}
		return stack.length === 0;
	}, [stack, defaultBottomItem]);

	/**
	 * 方法：clear
	 * 功能：清空栈
	 * 算法复杂度：O(1)
	 */
	const clear = () =>
		setStack(!!defaultBottomItem ? [defaultBottomItem] : []);

	return {
		stack,
		setStack,
		push,
		pop,
		popToItem,
		peek,
		isEmpty,
		clear,
		isOnlyDefaultItem,
	};
}
