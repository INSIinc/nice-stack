/**
 * @file reminder.service.ts
 * @description 提醒服务,用于处理问题截止日期提醒相关的业务逻辑
 * @author xxx
 * @date 2023-xx-xx
 */

import { Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { db, getUniqueItems, MessageMethodSchema, TroubleType, truncateString } from '@nicestack/common';
import { MessageService } from '@server/models/message/message.service';
import { extractUniqueStaffIds } from '@server/models/department/utils';

/**
 * 提醒服务类
 */
@Injectable()
export class ReminderService {
    /**
     * 日志记录器实例
     * @private
     */
    private readonly logger = new Logger(ReminderService.name);

    /**
     * 构造函数
     * @param messageService 消息服务实例
     */
    constructor(private readonly messageService: MessageService) { }

    /**
     * 生成提醒时间点
     * @param totalDays 总天数
     * @returns 提醒时间点数组
     */
    generateReminderTimes(totalDays: number): number[] {
        // 如果总天数小于3天则不需要提醒
        if (totalDays < 3) return [];
        // 使用Set存储提醒时间点,避免重复
        const reminders: Set<number> = new Set();
        // 按照2的幂次方划分时间点
        for (let i = 1; i <= totalDays / 2; i++) {
            reminders.add(Math.ceil(totalDays / Math.pow(2, i)));
        }
        // 将Set转为数组并升序排序
        return Array.from(reminders).sort((a, b) => a - b);
    }

    /**
     * 判断是否需要发送提醒
     * @param createdAt 创建时间
     * @param deadline 截止时间
     * @returns 是否需要提醒及剩余天数
     */
    shouldSendReminder(createdAt: Date, deadline: Date) {
        // 获取当前时间
        const now = dayjs();
        const end = dayjs(deadline);
        // 计算总时间和剩余时间(天)
        const totalTimeDays = end.diff(createdAt, 'day');
        const timeLeftDays = end.diff(now, 'day');

        if (totalTimeDays > 1) {
            // 获取提醒时间点
            const reminderTimes = this.generateReminderTimes(totalTimeDays);
            // 如果剩余时间在提醒时间点内,则需要提醒
            if (reminderTimes.includes(timeLeftDays)) {
                return { shouldSend: true, timeLeft: timeLeftDays };
            }
        }
        return { shouldSend: false, timeLeft: timeLeftDays };
    }

    /**
     * 发送截止日期提醒
     */
    async remindDeadline() {

    }
}
