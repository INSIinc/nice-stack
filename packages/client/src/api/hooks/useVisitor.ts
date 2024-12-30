import { api } from "../trpc";
import { TroubleParams } from "../../singleton/DataHolder";

export function useVisitor() {
	const utils = api.useUtils();
	const troubleParams = TroubleParams.getInstance();

	const create = api.visitor.create.useMutation({
		onSuccess() {
			utils.visitor.invalidate();
			utils.trouble.invalidate();
		},
	});
	/**
	 * 通用的乐观更新mutation工厂函数
	 * @param updateFn 更新数据的具体逻辑函数
	 * @returns 封装后的mutation配置对象
	 */
	const createOptimisticMutation = (
		updateFn: (item: any, variables: any) => any
	) => ({
		// 在请求发送前执行本地数据预更新
		onMutate: async (variables: any) => {
			const previousDataList: any[] = [];
			// 动态生成参数列表，包括星标和其他参数

			const paramsList = troubleParams.getItems();
			console.log(paramsList.length);
			// 遍历所有参数列表，执行乐观更新
			for (const params of paramsList) {
				// 取消可能的并发请求
				await utils.trouble.findManyWithCursor.cancel();
				// 获取并保存当前数据
				const previousData =
					utils.trouble.findManyWithCursor.getInfiniteData({
						...params,
					});
				previousDataList.push(previousData);
				// 执行乐观更新
				utils.trouble.findManyWithCursor.setInfiniteData(
					{
						...params,
					},
					(oldData) => {
						if (!oldData) return oldData;
						return {
							...oldData,
							pages: oldData.pages.map((page) => ({
								...page,
								items: page.items.map((item) =>
									item.id === variables?.troubleId
										? updateFn(item, variables)
										: item
								),
							})),
						};
					}
				);
			}

			return { previousDataList };
		},
		// 错误处理：数据回滚
		onError: (_err: any, _variables: any, context: any) => {
			const paramsList = troubleParams.getItems();
			paramsList.forEach((params, index) => {
				if (context?.previousDataList?.[index]) {
					utils.trouble.findManyWithCursor.setInfiniteData(
						{ ...params },
						context.previousDataList[index]
					);
				}
			});
		},
		// 成功后的缓存失效
		onSuccess: (_: any, variables: any) => {
			utils.visitor.invalidate();
			utils.trouble.findFirst.invalidate({
				where: {
					id: (variables as any)?.troubleId,
				},
			});
		},
	});
	// 定义具体的mutation
	const read = api.visitor.create.useMutation(
		createOptimisticMutation((item) => ({
			...item,
			views: (item.views || 0) + 1,
			readed: true,
		}))
	);

	const addStar = api.visitor.create.useMutation(
		createOptimisticMutation((item) => ({
			...item,
			star: true,
		}))
	);

	const deleteStar = api.visitor.deleteMany.useMutation(
		createOptimisticMutation((item) => ({
			...item,
			star: false,
		}))
	);

	const deleteMany = api.visitor.deleteMany.useMutation({
		onSuccess() {
			utils.visitor.invalidate();
		},
	});

	const createMany = api.visitor.createMany.useMutation({
		onSuccess() {
			utils.visitor.invalidate();
			utils.message.invalidate();
			utils.post.invalidate();
		},
	});

	return {
		troubleParams,
		create,
		createMany,
		deleteMany,
		read,
		addStar,
		deleteStar,
	};
}
