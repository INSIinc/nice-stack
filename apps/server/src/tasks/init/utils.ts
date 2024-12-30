import { db, getRandomElement, getRandomIntInRange, getRandomTimeInterval, ObjectType, TroubleType } from '@nicestack/common';
import dayjs from 'dayjs';
export interface DevDataCounts {
    deptCount: number;

    staffCount: number
    termCount: number
}
export async function getCounts(): Promise<DevDataCounts> {
    const counts = {
        deptCount: await db.department.count(),

        staffCount: await db.staff.count(),
        termCount: await db.term.count(),
    };
    return counts;
}
export function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
export function getRandomImageLinks(count: number = 5): string[] {
    const baseUrl = 'https://picsum.photos/200/300?random=';
    const imageLinks: string[] = [];

    for (let i = 0; i < count; i++) {
        // 生成随机数以确保每个链接都是唯一的
        const randomId = Math.floor(Math.random() * 1000);
        imageLinks.push(`${baseUrl}${randomId}`);
    }

    return imageLinks;
}

export function calculateTroubleAttributes(type: TroubleType) {
    const probability = type === TroubleType.RISK ? getRandomIntInRange(1, 10) : getRandomIntInRange(25, 100);
    const severity = type === TroubleType.RISK ? getRandomIntInRange(1, 10) : getRandomIntInRange(25, 100);
    const impact = type === TroubleType.TROUBLE ? getRandomIntInRange(25, 100) : null;
    const cost = type === TroubleType.TROUBLE ? getRandomIntInRange(25, 100) : null;
    const deadline = type !== TroubleType.RISK ? getRandomTimeInterval(2024).endDate : null;

    let level;
    if (type === TroubleType.TROUBLE) {
        level = getTroubleLevel(probability, severity, impact, cost, deadline);
    } else if (type === TroubleType.RISK) {
        level = getRiskLevel(probability, severity);
    } else {
        level = getRandomIntInRange(1, 4);
    }

    return { probability, severity, impact, cost, deadline, level };
}

export function determineState(type: TroubleType): number {
    if (type === TroubleType.TROUBLE) {
        return getRandomElement([0, 1, 2, 3]);
    } else {
        return getRandomElement([0, 4, 5]);
    }
}

export function getTroubleLevel(
    probability: number,
    severity: number,
    impact: number,
    cost: number,
    deadline: string | Date
) {
    const deadlineDays = dayjs().diff(dayjs(deadline), "day");
    let deadlineScore = 25;
    if (deadlineDays > 365) {
        deadlineScore = 100;
    } else if (deadlineDays > 90) {
        deadlineScore = 75;
    } else if (deadlineDays > 30) {
        deadlineScore = 50;
    }
    let total =
        0.257 * probability +
        0.325 * severity +
        0.269 * impact +
        0.084 * deadlineScore +
        0.065 * cost;
    if (total > 90) {
        return 4;
    } else if (total > 60) {
        return 3;
    } else if (total > 30) {
        return 2;
    } else if (probability * severity * impact * cost !== 1) {
        return 1;
    } else {
        return 0;
    }
}
export function getRiskLevel(probability: number, severity: number) {
    if (probability * severity > 70) {
        return 4;
    } else if (probability * severity > 42) {
        return 3;
    } else if (probability * severity > 21) {
        return 2;
    }
    return 1;
}