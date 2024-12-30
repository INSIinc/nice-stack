import type {
	Staff,
	Department,
	Term,
	Message,
	Post,
	RoleMap,
} from "@prisma/client";
import { SocketMsgType, RolePerms } from "./enum";
import { RowRequestSchema } from "./schema";
import { z } from "zod";
// import { MessageWithRelations, PostWithRelations, TroubleWithRelations } from "./generated";
export interface SocketMessage<T = any> {
	type: SocketMsgType;
	payload?: T;
}

export interface DataNode {
	title: any;
	key: string;
	hasChildren?: boolean;
	children?: DataNode[];
	value: string;
	data?: any;
	isLeaf?: boolean;
}

export interface JwtPayload {
	sub: string;
	username: string;
}
export type AppLocalSettings = {
	urgent?: number;
	important?: number;
	exploreTime?: Date;
};
export type StaffDto = Staff & {
	domain?: Department;
	department?: Department;
};
export interface AuthDto {
	token: string;
	staff: StaffDto;
	refreshToken: string;
	perms: string[];
}
export type UserProfile = Staff & {
	permissions: RolePerms[];
	deptIds: string[];
	parentDeptIds: string[];
	domain: Department;
	department: Department;
};
export interface ObjectWithId {
	id: string; // Ensure the row contains at least an 'id' field
	[key: string]: any; // Allow additional fields as needed
}

export interface DataNode {
	title: any;
	key: string;
	value: string;
	data?: any;
	order?: string;
	id?: string;
}
export interface TreeDataNode extends DataNode {
	hasChildren?: boolean;
	children?: TreeDataNode[];
	isLeaf?: boolean;
	pId?: string;
}
export interface DeptSimpleTreeNode extends TreeDataNode {
	hasStaff?: boolean;
}
export type StaffRowModel = {
	avatar: string;
	dept_name: string;
	officer_id: string;
	phone_number: string;
	showname: string;
	username: string;
};
export interface TokenPayload {
	id: string;
	phoneNumber: string;
	name: string;
}
export interface ResPerm {
	instruction?: boolean;
	createProgress?: boolean;
	requestCancel?: boolean;
	acceptCancel?: boolean;

	conclude?: boolean;
	createRisk?: boolean;
	editIndicator?: boolean;
	editMethod?: boolean;
	editOrg?: boolean;

	edit?: boolean;
	delete?: boolean;
	read?: boolean;
}

export type MessageDto = Message & {
	readed: boolean;
	receivers: Staff[];
	sender: Staff;
};
export type PostComment = {
	id: string;
	type: string;
	title: string;
	content: string;
	authorId: string;
	domainId: string;
	referenceId: string;
	attachments: string[];
	createdAt: Date;
	updatedAt: Date;
	parentId: string;
	author: {
		id: string;
		showname: string;
		username: string;
		avatar: string;
	};
};
export type PostDto = Post & {
	readed: boolean;
	readedCount: number;
	author: StaffDto;
	limitedComments: PostComment[];
	commentsCount: number;
	perms?: {
		delete: boolean;
		// edit: boolean;
	};
	watchDepts: Department[];
	watchStaffs: Staff[];
};

export type TermDto = Term & {
	permissions: ResPerm;
	children: TermDto[];
	hasChildren: boolean;
};
export type DepartmentDto = Department & {
	parent: DepartmentDto;
	children: DepartmentDto[];
	hasChildren: boolean;
	staffs: StaffDto[];
	terms: TermDto[]
};
export type RoleMapDto = RoleMap & {
	staff: StaffDto
}
export interface BaseSetting {
	// termAvatars?: Record<string, string>; //termId - url
	appConfig?: {
		splashScreen?: string;
		devDept?: string;
		// fakeError?: {
		// 	title?: string | null;
		// 	content?: string | null;
		// 	time?: string | null;
		// };
	};
}
export type RowModelResult = {
	rowData: any[];
	rowCount: number;
};
export type RowModelRequest = z.infer<typeof RowRequestSchema>;
export interface ChangedRows {
	rows: any[];
	op: "add" | "update" | "remove";
}
