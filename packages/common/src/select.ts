import { Prisma } from "@prisma/client";

export const postDetailSelect: Prisma.PostSelect = {
	id: true,
	type: true,
	title: true,
	content: true,
	attachments: true,
	referenceId: true,
	watchDepts: true,
	watchStaffs: true,
	updatedAt: true,
	author: {
		select: {
			id: true,
			showname: true,
			avatar: true,
			department: {
				select: {
					id: true,
					name: true,
				},
			},
			domain: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	},
};
export const postUnDetailSelect: Prisma.PostSelect = {
	id: true,
	type: true,
	title: true,
	content: true,
	attachments: true,
	updatedAt: true,
	referenceId: true,
	author: {
		select: {
			id: true,
			showname: true,
			avatar: true,
			department: {
				select: {
					id: true,
					name: true,
				},
			},
			domain: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	},
};
export const messageDetailSelect: Prisma.MessageSelect = {
	id: true,
	sender: true,
	content: true,
	title: true,
	url: true,
	option: true,
	intent: true,
};
