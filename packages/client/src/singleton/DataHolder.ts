export class TroubleParams {
	private static instance: TroubleParams; // 静态私有变量，用于存储单例实例
	private troubleParams: Array<object>; // 私有数组属性，用于存储对象

	private constructor() {
		this.troubleParams = []; // 初始化空数组
	}

	public static getInstance(): TroubleParams {
		if (!TroubleParams.instance) {
			TroubleParams.instance = new TroubleParams();
		}
		return TroubleParams.instance;
	}

	public addItem(item: object): void {
		// 代码意图解析: 向数组中添加一个对象，确保不会添加重复的对象。
		// 技术原理阐述: 在添加对象之前，使用 `some` 方法检查数组中是否已经存在相同的对象。如果不存在，则添加到数组中。
		// 数据结构解读: `some` 方法遍历数组，检查是否存在满足条件的元素。`JSON.stringify` 用于将对象转换为字符串进行比较。
		// 算法复杂度分析: `some` 方法的复杂度为 O(n)，因为需要遍历数组中的每个元素。`JSON.stringify` 的复杂度取决于对象的大小，通常为 O(m)，其中 m 是对象的属性数量。因此，总复杂度为 O(n * m)。
		// 可能的优化建议: 如果数组非常大，可以考虑使用哈希表（如 `Map` 或 `Set`）来存储对象的唯一标识符，以提高查找效率。

		const isDuplicate = this.troubleParams.some(
			(existingItem) =>
				JSON.stringify(existingItem) === JSON.stringify(item)
		);

		if (!isDuplicate) {
			this.troubleParams.push(item);
		}
	}

	public getItems(): Array<object> {
		return [...this.troubleParams]; // 返回数组的副本，防止外部直接修改原数组
	}
}
