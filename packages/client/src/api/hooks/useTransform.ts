import { getQueryKey } from "@trpc/react-query";
import { api } from "../trpc"; // Adjust path as necessary
import { useQueryClient } from "@tanstack/react-query";
export function useTransform() {
	const queryClient = useQueryClient();
	const queryKey = getQueryKey(api.transform);
	const termQueryKey = getQueryKey(api.term);
	const deptQueryKey = getQueryKey(api.department);

	const importTerms = api.transform.importTerms.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({ queryKey: termQueryKey });
		},
	});
	const importDepts = api.transform.importDepts.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({ queryKey: deptQueryKey });
		},
	});
	const importStaffs = api.transform.importStaffs.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
		},
	});

	return {
		importTerms,
		importDepts,
		importStaffs,

	};
}
