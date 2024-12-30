import { Prisma } from "@prisma/client";
import {
	AppConfigSlug,
	RiskState,
	RolePerms,
	TaxonomySlug,
	TroubleParamsKey,
	TroubleState,
	TroubleType,
	VisitType,
} from "./enum";
import { troubleUnDetailSelect } from "./select";

export const InitRoles: {
	name: string;
	permissions: string[];
	system?: boolean;
}[] = [
	{
		name: "基层",
		permissions: [
			RolePerms.CREATE_TROUBLE,
			RolePerms.CREATE_WORKPROGRESS,
			RolePerms.READ_DOM_TERM,
			RolePerms.READ_AUDIT_TROUBLE,
		],
	},
	{
		name: "机关",
		permissions: [
			RolePerms.CREATE_TROUBLE,
			RolePerms.CREATE_WORKPROGRESS,
			RolePerms.CREATE_ALERT,
			RolePerms.READ_DOM_TERM,
			RolePerms.MANAGE_DOM_TROUBLE,
			RolePerms.READ_AUDIT_TROUBLE,
		],
	},
	{
		name: "领导",
		permissions: [
			RolePerms.READ_DOM_TERM,
			RolePerms.READ_DOM_TROUBLE,
			RolePerms.CREATE_INSTRUCTION,
		],
	},
	{
		name: "域管理员",
		permissions: Object.keys(RolePerms).filter(
			(perm) =>
				![
					RolePerms.READ_ANY_CHART,
					RolePerms.READ_ANY_TROUBLE,
					RolePerms.READ_ANY_TERM,
				].includes(perm as any)
		) as RolePerms[],
	},
	{
		name: "根管理员",
		permissions: Object.keys(RolePerms) as RolePerms[],
	},
];
export const InitTaxonomies: { name: string; slug: string }[] = [
	{
		name: "分类",
		slug: TaxonomySlug.CATEGORY,
	},
	{
		name: "研判单元",
		slug: TaxonomySlug.UNIT,
	},
	{
		name: "标签",
		slug: TaxonomySlug.TAG,
	},
];
export const InitAppConfigs: Prisma.AppConfigCreateInput[] = [
	{
		title: "基本设置",
		slug: AppConfigSlug.BASE_SETTING,
		description: "",
	},
];
