import { api } from "../trpc";

export function usePost() {
	const utils = api.useUtils();
	const create = api.post.create.useMutation({
		onSuccess: () => {
			utils.post.invalidate();
		},
	});
	const update = api.post.update.useMutation({
		onSuccess: () => {
			utils.post.invalidate();
		},
	});
	const deleteMany = api.post.deleteMany.useMutation({
		onSuccess: () => {
			utils.post.invalidate();
		},
	});
	const softDeleteByIds = api.post.softDeleteByIds.useMutation({
		onSuccess: () => {
			utils.post.invalidate();
		},
	});
	const restoreByIds = api.post.restoreByIds.useMutation({
		onSuccess: () => {
			utils.post.invalidate();
		},
	})
	return {
		create,
		update,
		deleteMany,
		softDeleteByIds,
		restoreByIds
	};
}
