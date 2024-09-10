import { getQueryKey } from "@trpc/react-query";
import { api } from "../utils/trpc"; // Adjust path as necessary
import { useQueryClient } from "@tanstack/react-query";
export function useTransform() {
	const queryClient = useQueryClient();
	const queryKey = getQueryKey(api.transform);
	const importTerms = api.transform.importTerms.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
		},
	});
	const importDepts = api.transform.importDepts.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey });
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
