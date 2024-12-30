import { api } from "../trpc";
import { AppConfigSlug, BaseSetting } from "@nicestack/common";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useAppConfig() {
	const utils = api.useUtils()
	const [baseSetting, setBaseSetting] = useState<BaseSetting | undefined>();

	const { data, isLoading }: { data: any; isLoading: boolean } =
		api.app_config.findFirst.useQuery({
			where: { slug: AppConfigSlug.BASE_SETTING }
		});
	const handleMutationSuccess = useCallback(() => {
		utils.app_config.invalidate()
	}, [utils]);

	// Use the generic success handler in mutations
	const create: any = api.app_config.create.useMutation({
		onSuccess: handleMutationSuccess,
	});
	const update: any = api.app_config.update.useMutation({
		onSuccess: handleMutationSuccess,
	});
	const deleteMany = api.app_config.deleteMany.useMutation({
		onSuccess: handleMutationSuccess,
	});
	useEffect(() => {
		if (data?.meta) {
			setBaseSetting(JSON.parse(data?.meta));
		}

	}, [data, isLoading]);
	const splashScreen = useMemo(() => {
		return baseSetting?.appConfig?.splashScreen;
	}, [baseSetting]);
	const devDept = useMemo(() => {
		return baseSetting?.appConfig?.devDept;
	}, [baseSetting]);
	return {

		create,
		deleteMany,
		update,
		baseSetting,
		splashScreen,
		devDept,
		isLoading,
	};
}
