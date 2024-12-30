import { z } from "zod";
import { ObjectType, RiskState, TroubleState } from "./enum";
export const AuthSchema = {
	signUpRequest: z.object({
		username: z.string(),
		password: z.string(),
		deptId: z.string().nullish(),
		officerId: z.string().nullish(),
		showname: z.string().nullish(),
		phoneNumber: z.string().nullish(),
	}),
	refreshTokenRequest: z.object({
		refreshToken: z.string(),
		sessionId: z.string(),
	}),
	logoutRequest: z.object({
		refreshToken: z.string(),
		sessionId: z.string(),
	}),
	signInRequset: z.object({
		username: z.string().nullish(),
		password: z.string().nullish(),
		phoneNumber: z.string().nullish(),
	}),
	changePassword: z.object({
		phoneNumber: z.string().nullish(),
		newPassword: z.string(),
		renewPassword: z.string(),
		username: z.string().nullish(),
	}),
	refreshToken: z.object({
		refreshToken: z.string(),
	}),
	logout: z.object({
		refreshToken: z.string(),
	}),
};
const SortModel = z.object({
	colId: z.string(),
	sort: z.enum(["asc", "desc"]),
});
export const UpdateOrderSchema = z.object({
	id: z.string(),
	overId: z.string(),
});
export const RowRequestSchema = z.object({
	startRow: z.number().nullish(),
	endRow: z.number().nullish(),
	rowGroupCols: z.array(
		z.object({
			id: z.string(),
			displayName: z.string(),
			field: z.string(),
		})
	),
	valueCols: z.array(
		z.object({
			id: z.string().nullish(),
			displayName: z.string().nullish(),
			aggFunc: z.string().nullish(),
			field: z.string().nullish(),
		})
	),
	pivotCols: z.array(z.any()).nullish(),
	pivotMode: z.boolean().nullish(),
	groupKeys: z.array(z.any()).nullish(),
	filterModel: z.any().nullish(),
	sortModel: z.array(SortModel).nullish(),
	includeDeleted: z.boolean().nullish()
});
export const StaffMethodSchema = {
	create: z.object({
		showname: z.string().nullish(),
		username: z.string(),
		phoneNumber: z.string().nullish(),
		domainId: z.string().nullish(),
		password: z.string().nullish(),
		deptId: z.string().nullish(),
		officerId: z.string().nullish(),
		emitChange: z.boolean().nullish(),
		hashedPassword: z.string().nullish(),
	}),
	update: z.object({
		id: z.string(),
		showname: z.string().nullish(),
		username: z.string().nullish(),
		domainId: z.string().nullish(),
		deptId: z.string().nullish(),
		phoneNumber: z.string().nullish(),
		order: z.number().nullish(),
		registerToken: z.string().nullish(),
		password: z.string().nullish(),
		officerId: z.string().nullish(),
	}),
	delete: z.object({
		id: z.string(),
	}),
	deleteMany: z.object({
		ids: z.array(z.string()),
	}),
	findByDept: z.object({
		deptId: z.string(),
		domainId: z.string().nullish(),
	}),
	findMany: z.object({
		keyword: z.string().nullish(),
		domainId: z.string().nullish(),
		deptId: z.string().nullish(),
		limit: z.number().nullish(),
		ids: z.array(z.string()).nullish(),
	}),
	findUnique: z.object({
		phoneNumber: z.string().nullish(),
		id: z.string().nullish(),
	}),
	paginate: z.object({
		page: z.number(),
		pageSize: z.number(),
		domainId: z.string().nullish(),
		deptId: z.string().nullish(),
		ids: z.array(z.string()).nullish(),
	}),
	getRows: RowRequestSchema.extend({
		domainId: z.string().nullish(),
	}),
};

export const DepartmentMethodSchema = {
	create: z.object({
		name: z.string(),
		termIds: z.array(z.string()).nullish(),
		parentId: z.string().nullish(),
		isDomain: z.boolean().nullish(),
	}),
	getRows: RowRequestSchema.extend({
		parentId: z.string().nullish(),
	}),
	update: z.object({
		id: z.string(),
		name: z.string().nullish(),
		termIds: z.array(z.string()).nullish(),
		parentId: z.string().nullish(),
		deletedAt: z.date().nullish(),
		order: z.number().nullish(),
		isDomain: z.boolean().nullish(),
	}),
	delete: z.object({
		id: z.string(),
	}),
	findMany: z.object({
		keyword: z.string().nullish(),
		ids: z.array(z.string()).nullish(),
		limit: z.number().nullish(),
		domain: z.boolean().nullish(),
	}),
	findById: z.object({
		id: z.string(),
	}),
	paginate: z.object({
		page: z.number(),
		pageSize: z.number(),
		ids: z.array(z.string()).nullish(),
	}),
	getSimpleTree: z.object({
		deptIds: z.array(z.string().nullish()).nullish(),
		parentId: z.string().nullish(),
		domain: z.boolean().nullish(),
		rootId: z.string().nullish(),
	}),
};

export const TransformMethodSchema = {
	importTrouble: z.object({
		base64: z.string(),
		domainId: z.string().nullish(),
	}),
	importStaffs: z.object({
		base64: z.string(),
		domainId: z.string().nullish(),
	}),
	importTerms: z.object({
		base64: z.string(),
		domainId: z.string().nullish(),
		taxonomyId: z.string().nullish(),
		parentId: z.string().nullish(),
	}),
	importDepts: z.object({
		base64: z.string(),
		domainId: z.string().nullish(),
		parentId: z.string().nullish(),
	}),
	exportTroubles: z.object({
		termIdFilters: z.map(z.string(), z.array(z.string())).nullish(),
		deptIds: z.array(z.string()).nullish(),
		search: z.string().nullish(),
		type: z.string().nullish(),
		levels: z.array(z.number()).nullish(),
		createStartDate: z.string().nullish(),
		createEndDate: z.string().nullish(),
		domainId: z.string().nullish(),
		states: z
			.array(
				z.union([z.nativeEnum(TroubleState), z.nativeEnum(RiskState)])
			)
			.nullish(),
	}),
};
export const TermMethodSchema = {
	getRows: RowRequestSchema.extend({
		parentId: z.string().nullish(),
		domainId: z.string().nullish(),
		taxonomyId: z.string().nullish(),
	}),
	create: z.object({
		name: z.string(),
		description: z.string().nullish(),
		domainId: z.string().nullish(),
		// slug: z.string().min(1), // Assuming slug cannot be empty
		parentId: z.string().nullish(), // Optional field
		taxonomyId: z.string(), // Optional field
		watchStaffIds: z.array(z.string()).nullish(),
		watchDeptIds: z.array(z.string()).nullish(),
	}),
	update: z.object({
		id: z.string(),
		description: z.string().nullish(),
		parentId: z.string().nullish(),
		domainId: z.string().nullish(),
		name: z.string().nullish(),
		// slug: z.string().nullish(),
		taxonomyId: z.string().nullish(),
		order: z.number().nullish(),
		watchStaffIds: z.array(z.string()).nullish(),
		watchDeptIds: z.array(z.string()).nullish(),
	}),
	delete: z.object({
		id: z.string(),
	}),
	paginate: z.object({
		page: z.number().min(1),
		pageSize: z.number().min(1),
	}),
	deleteMany: z.object({
		ids: z.array(z.string()),
	}),
	findManyWithCursor: z.object({
		cursor: z.string().nullish(),
		search: z.string().nullish(),
		limit: z.number().min(1).max(100).nullish(),
		taxonomyId: z.string().nullish(),
		taxonomySlug: z.string().nullish(),
		id: z.string().nullish(),
		initialIds: z.array(z.string()).nullish(),
	}),
	getChildren: z.object({
		parentId: z.string().nullish(),
		domainId: z.string().nullish(),
		taxonomyId: z.string().nullish(),
		cursor: z.string().nullish(),
		limit: z.number().min(1).max(100).nullish(),
	}),
	getSimpleTree: z.object({
		termIds: z.array(z.string().nullish()).nullish(),
		parentId: z.string().nullish(),
		taxonomyId: z.string().nullish(),
	}),
	findMany: z.object({
		keyword: z.string().nullish(),
		ids: z.array(z.string()).nullish(),
		taxonomyId: z.string().nullish(),
		taxonomySlug: z.string().nullish(),
		limit: z.number().nullish(),
	}),
	getTreeData: z.object({
		taxonomyId: z.string().nullish(),
		taxonomySlug: z.string().nullish(),
		domainId: z.string().nullish(),
	}),
};
export const RoleMapMethodSchema = {
	create: z.object({
		objectId: z.string(),
		roleId: z.string(),
		domainId: z.string(),
		objectType: z.nativeEnum(ObjectType),
	}),
	update: z.object({
		id: z.string(),
		objectId: z.string().nullish(),
		roleId: z.string().nullish(),
		domainId: z.string().nullish(),
		objectType: z.nativeEnum(ObjectType).nullish(),
	}),
	setRolesForObject: z.object({
		objectId: z.string(),
		roleIds: z.array(z.string()),
		domainId: z.string(),
		objectType: z.nativeEnum(ObjectType),
	}),
	setRoleForObjects: z.object({
		objectIds: z.array(z.string()),
		roleId: z.string(),
		domainId: z.string().nullish(),
		objectType: z.nativeEnum(ObjectType),
	}),
	deleteMany: z.object({
		ids: z.array(z.string()),
	}),
	paginate: z.object({
		page: z.number().min(1),
		pageSize: z.number().min(1),
		domainId: z.string().nullish(),
		roleId: z.string().nullish(),
	}),
	deleteWithObject: z.object({
		objectId: z.string(),
	}),

	getRoleMapDetail: z.object({
		roleId: z.string(),
		domainId: z.string().nullish(),
	}),
	getPermsForObject: z.object({
		domainId: z.string(),
		staffId: z.string(),
		deptId: z.string(),
	}),
	getRows: RowRequestSchema.extend({
		roleId: z.string().nullish(),
		domainId: z.string().nullish(),
	}),
	getStaffsNotMap: z.object({
		domainId: z.string().nullish(),
		roleId: z.string().nullish(),
	}),
};
export const RoleMethodSchema = {
	create: z.object({
		name: z.string(),
		permissions: z.array(z.string()).nullish(),
	}),
	update: z.object({
		id: z.string(),
		name: z.string().nullish(),
		permissions: z.array(z.string()).nullish(),
	}),
	deleteMany: z.object({
		ids: z.array(z.string()),
	}),
	paginate: z.object({
		page: z.number().nullish(),
		pageSize: z.number().nullish(),
	}),
	findMany: z.object({
		keyword: z.string().nullish(),
	}),
};
export const TaxonomyMethodSchema = {
	create: z.object({
		name: z.string(),
		slug: z.string(),
		objectType: z.array(z.nativeEnum(ObjectType)).nullish(),
	}),
	delete: z.object({
		id: z.string(),
	}),
	findByName: z.object({
		name: z.string(),
	}),
	findBySlug: z.object({
		slug: z.string(),
	}),
	findById: z.object({
		id: z.string(),
	}),
	deleteMany: z.object({
		ids: z.array(z.string()),
	}),
	update: z.object({
		id: z.string(),
		name: z.string().nullish(),
		slug: z.string().nullish(),
		order: z.number().nullish(),
		objectType: z.array(z.nativeEnum(ObjectType)).nullish(),
	}),
	paginate: z.object({
		page: z.number().min(1),
		pageSize: z.number().min(1),
	}),
	getAll: z.object({
		type: z.nativeEnum(ObjectType).nullish(),
	}),
};

export const BaseCursorSchema = z.object({
	cursor: z.string().nullish(),
	limit: z.number().min(-1).max(100).nullish(),
	keyword: z.string().nullish(),
	states: z.array(z.number()).nullish(),
	termIds: z.array(z.string()).nullish(),
	termIdFilters: z.map(z.string(), z.array(z.string())).nullish(),
	selectedIds: z.array(z.string()).nullish(),
	initialIds: z.array(z.string()).nullish(),
	excludeIds: z.array(z.string()).nullish(),
	createStartDate: z.date().nullish(),
	createEndDate: z.date().nullish(),
	deptId: z.string().nullish(),
});


