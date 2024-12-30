export enum SocketMsgType {
	NOTIFY,
}
export enum PostType {
	TROUBLE_PROGRESS = "trouble_progress",
	TROUBLE_INSTRUCTION = "trouble_instrcution",
	POST = "post",
	POST_COMMENT = "post_comment",
}
export enum TaxonomySlug {
	CATEGORY = "category",
	UNIT = "unit",
	TAG = "tag",
}
export enum VisitType {
	STAR = "star",
	READED = "read",
}
export enum TroubleState {
	AUDITING = 0,
	PROCESSING = 1,
	CANCEL_REQUEST = 2,
	CANCELED = 3,
}
export enum RiskState {
	AUDITING = 0,
	CONTROLLING = 4,
	RELEASED = 5,
}

export enum QuadrantType {
	URG_IMPORTANT = "super",
	URGENT = "urgent",
	IMPORTANT = "imporant",
	TRIVIAL = "trival",
}
export enum TroubleType {
	RISK = "安全风险",
	TROUBLE = "问题隐患",
	ALERT = "风险预警",
}
export enum AssessmentStatus {
	ASSESSING = "评估中",
	COMPLETED = "已完成",
}
export enum TermType {
	RISK_UNIT = "RISK_UNIT",
	RISK_INDICATOR = "RISK_INDICATOR",
	RISK_CATEGORY = "RISK_CATEGORY",
}
export enum ObjectType {
	DEPARTMENT = "department",
	STAFF = "staff",
	COMMENT = "comment",
	TERM = "term",
	TROUBLE = "trouble",
	APP_CONFIG = "app_config",
	ROLE = "role",
	ROLE_MAP = "rolemap",
	MESSAGE = "message",
	POST = "post",
	VISIT = "visit",
}
export enum RolePerms {
	// Create Permissions 创建权限
	CREATE_ALERT = "CREATE_ALERT", // 创建警报
	CREATE_INSTRUCTION = "CREATE_INSTRUCTION", // 创建指令
	CREATE_TROUBLE = "CREATE_TROUBLE", // 创建问题
	CREATE_WORKPROGRESS = "CREATE_WORKPROGRESS", // 创建工作进度
	CREATE_ASSESSMENT = "CREATE_ASSESSMENT", // 创建评估
	CREATE_TERM = "CREATE_TERM", // 创建术语
	// Read Permissions 读取权限
	READ_ANY_TROUBLE = "READ_ANY_TROUBLE", // 读取任何问题
	READ_DOM_TROUBLE = "READ_DOM_TROUBLE", // 读取领域问题
	READ_AUDIT_TROUBLE = "READ_AUDIT_TROUBLE",
	READ_ANY_CHART = "READ_ANY_CHART", // 读取任何图表
	READ_DOM_CHART = "READ_DOM_CHART", // 读取领域图表
	READ_ANY_ASSESSMENT = "READ_ANY_ASSESSMENT", // 读取任何评估
	READ_DOM_ASSESSMENT = "READ_DOM_ASSESSMENT", // 读取领域评估
	READ_ANY_TERM = "READ_ANY_TERM", // 读取任何术语
	READ_DOM_TERM = "READ_DOM_TERM", // 读取领域术语

	READ_ANY_POST = "READ_ANY_POST", // 读取任何问题
	READ_DOM_POST = "READ_DOM_POST", // 读取领域问题

	MANAGE_ANY_POST = "MANAGE_ANY_POST",
	MANAGE_DOM_POST = "MANAGE_DOM_POST",
	MANAGE_ANY_TROUBLE = "MANAGE_ANY_TROUBLE",
	MANAGE_DOM_TROUBLE = "MANAGE_DOM_TROUBLE",

	MANAGE_DOM_TERM = "MANAGE_DOM_TERM",
	MANAGE_ANY_TERM = "MANAGE_ANY_TERM",
	MANAGE_BASE_SETTING = "MANAGE_BASE_SETTING",
	// Staff and Department Permissions
	MANAGE_ANY_STAFF = "MANAGE_ANY_STAFF",
	MANAGE_DOM_STAFF = "MANAGE_DOM_STAFF",
	MANAGE_ANY_DEPT = "MANAGE_ANY_DEPT",
	MANAGE_DOM_DEPT = "MANAGE_DOM_DEPT",
	// Role Permissions
	MANAGE_ANY_ROLE = "MANAGE_ANY_ROLE",
	MANAGE_DOM_ROLE = "MANAGE_DOM_ROLE",
}
export enum RemindType {
	BOTH = "both",
	CHECK = "check",
	DUTY = "duty",
}

export const LevelColor = {
	1: "#BBDDFF",
	2: "#FFE6B3",
	3: "#FFC2C2",
	4: "#FFC2C2",
} as const;

export enum AppConfigSlug {
	BASE_SETTING = "base_setting",
}
export const TroubleStateMap = {
	[TroubleState.AUDITING]: "待审核",
	[TroubleState.PROCESSING]: "处理中",
	[TroubleState.CANCEL_REQUEST]: "待销帐",
	[TroubleState.CANCELED]: "已销帐",
};
export const RiskStateMap = {
	[RiskState.AUDITING]: "待审核",
	[RiskState.CONTROLLING]: "管控中",
	[RiskState.RELEASED]: "已解除",
};
export const TroubleTypeStateMap = new Map<string, string>([
	[`${TroubleType.TROUBLE}_${TroubleState.AUDITING}`, "待审核"],
	[`${TroubleType.TROUBLE}_${TroubleState.PROCESSING}`, `处理中`],
	[`${TroubleType.TROUBLE}_${TroubleState.CANCEL_REQUEST}`, `待销帐`],
	[`${TroubleType.TROUBLE}_${TroubleState.CANCELED}`, `已销帐`],

	[`${TroubleType.RISK}_${RiskState.AUDITING}`, "待审核"],
	[`${TroubleType.RISK}_${RiskState.CONTROLLING}`, `管控中`],
	[`${TroubleType.RISK}_${RiskState.RELEASED}`, `已解除`],

	[`${TroubleType.ALERT}_${RiskState.AUDITING}`, "待审核"],
	[`${TroubleType.ALERT}_${RiskState.CONTROLLING}`, `管控中`],
	[`${TroubleType.ALERT}_${RiskState.RELEASED}`, `已解除`],
]);
export const TroubleLevelMap = new Map<string, string>([
	[`${TroubleType.TROUBLE}_0`, "全部级别"],
	[`${TroubleType.TROUBLE}_1`, `四级隐患`],
	[`${TroubleType.TROUBLE}_2`, `三级隐患`],
	[`${TroubleType.TROUBLE}_3`, `二级隐患`],
	[`${TroubleType.TROUBLE}_4`, `一级隐患`],

	[`${TroubleType.RISK}_0`, "全部级别"],
	[`${TroubleType.RISK}_1`, `一般风险`],
	[`${TroubleType.RISK}_2`, `较大风险`],
	[`${TroubleType.RISK}_3`, `重大风险`],
	[`${TroubleType.RISK}_4`, `特大风险`],

	[`${TroubleType.ALERT}_0`, "全部预警"],
	[`${TroubleType.ALERT}_1`, `蓝色预警`],
	[`${TroubleType.ALERT}_2`, `黄色预警`],
	[`${TroubleType.ALERT}_3`, `橙色预警`],
	[`${TroubleType.ALERT}_4`, `红色预警`],
]);
export function GetTroubleLevel(
	type: string | undefined,
	level: number | undefined
): string | undefined {
	return TroubleLevelMap.get(`${type || "ELSE"}_${level}`) || "暂未评级";
}
export function GetTroubleState(
	type: string | undefined,
	state: number | undefined
): string | undefined {
	return TroubleTypeStateMap.get(`${type || "ELSE"}_${state}`) || "无状态";
}
export enum SendMessageType {
	TO_DUTY = "to_duty",
	TO_CHECK = "to_check",
	TO_REQUEST_DELAY = "to_request_delay",
	TO_DELAY = "to_delay",
	TO_REQUEST_CANCEL = "to_request_cancel",
	INSTRUCTION = "instrcution",
	PROGRESS = "progress",
}

export enum DraftType {
	TROUBLE = "trouble_darft",
	POST = "post_darft",
}
export enum ForwardType {
	TROUBLE = "trouble",
	POST = "post",
}
export enum ToWhoType {
	DOMAIN = "本域可见",
	DEPT = "本单位可见",
	SELF = "仅自己可见",
	CUSTOM = "自定义",
}
// 定义枚举来存储查询键
export enum TroubleParamsKey {
	RISK_AUDITING = "RISK_AUDITING",
	RISK_CONTROLLING = "RISK_CONTROLLING",
	RISK_RELEASED = "RISK_RELEASED",
	TROUBLE_AUDITING = "TROUBLE_AUDITING",
	TROUBLE_PROCESSING = "TROUBLE_PROCESSING",
	TROUBLE_CANCEL_REQUEST = "TROUBLE_CANCEL_REQUEST",
	TROUBLE_CANCELED = "TROUBLE_CANCELED",
	STAR = "STAR",
	DUTY = "DUTY",
	CHECK = "CHECK",
}
