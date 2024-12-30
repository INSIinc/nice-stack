/**
 * 该模块提供了一个集中式的事件总线，用于处理不同类型对象的数据变更事件。
 * 它使用 `mitt` 库进行事件管理，并为不同类型的对象定义了特定的事件处理器。
 */

import mitt from 'mitt';
import { DepartmentDto, ObjectType, RoleMapDto, StaffDto, TermDto, } from '@nicestack/common';

/**
 * 枚举类型，表示可以对数据执行的CRUD操作。
 */
export enum CrudOperation {
    CREATED, // 创建操作
    UPDATED, // 更新操作
    DELETED  // 删除操作
}

/**
 * 类型定义，表示事件总线可以发出的事件类型。
 */
type Events = {
    dataChanged: { type: ObjectType, operation: CrudOperation, data: any } // 数据变更事件
};

/**
 * 事件总线实例，用于发出和监听数据变更事件。
 */
export const EventBus = mitt<Events>();

/**
 * 类型定义，表示一个用于发出数据变更事件的函数。
 * @template T - 要发出的数据的类型。
 */
type EmitChangeFunction<T> = (data: Partial<T>, operation: CrudOperation) => void;

/**
 * 接口定义，表示不同类型对象的数据变更事件处理器。
 */
interface EmitChangeHandlers {
    [ObjectType.STAFF]: EmitChangeFunction<StaffDto>; // 员工数据变更处理器
    [ObjectType.ROLE_MAP]: EmitChangeFunction<RoleMapDto>; // 角色映射数据变更处理器
    [ObjectType.DEPARTMENT]: EmitChangeFunction<DepartmentDto>; // 部门数据变更处理器
    [ObjectType.TERM]: EmitChangeFunction<TermDto> // 术语数据变更处理器
}

/**
 * 对象，包含不同类型对象的数据变更事件处理器。
 */
const emitChangeHandlers: EmitChangeHandlers = {
    [ObjectType.STAFF]: (data, operation) => {
        // 转换员工数据，包含额外字段
        const rowData = {
            ...data,
            officer_id: data.officerId,
            phone_number: data.phoneNumber,
            dept_name: data.department?.name,
            domain_name: data.domain?.name
        };

        // 发出员工数据变更事件
        EventBus.emit("dataChanged", {
            type: ObjectType.STAFF,
            operation,
            data: [rowData]
        });
    },

    [ObjectType.ROLE_MAP]: (data, operation) => {
        // 转换角色映射数据，包含额外字段
        const rowData = {
            staff_username: data.staff?.username,
            staff_showname: data.staff?.showname,
            staff_officer_id: data.staff?.officerId,
            department_name: data.staff?.department?.name,
            ...data,
        };
        // 发出角色映射数据变更事件
        EventBus.emit("dataChanged", {
            type: ObjectType.ROLE_MAP,
            operation,
            data: [rowData]
        });
    },

    [ObjectType.DEPARTMENT]: (data, operation) => {
        // 转换部门数据，包含额外字段
        const rowData = {
            is_domain: data.isDomain,
            parent_id: data.parentId,
            has_children: data.hasChildren,
            ...data,
        };
        // 发出部门数据变更事件
        EventBus.emit("dataChanged", {
            type: ObjectType.DEPARTMENT,
            operation,
            data: [rowData]
        });
    },
    [ObjectType.TERM]: (data, operation) => {
        // 转换术语数据，包含额外字段
        const rowData = {
            taxonomy_id: data.taxonomyId,
            parent_id: data.parentId,
            has_children: data.hasChildren,
            ...data,
        };
        // 发出术语数据变更事件
        EventBus.emit("dataChanged", {
            type: ObjectType.TERM,
            operation,
            data: [rowData]
        });
    }
};

/**
 * 函数，用于发出特定对象类型的数据变更事件。
 * @param type - 发生变更的对象类型。
 * @param data - 与变更相关的数据。
 * @param operation - 执行的CRUD操作。
 */
export function emitDataChange(type: ObjectType, data: any, operation: CrudOperation) {
    // 获取指定对象类型的事件处理器
    const handler = emitChangeHandlers[type];
    if (handler) {
        // 调用处理器发出数据变更事件
        handler(data, operation);
    } else {
        // 如果未找到指定对象类型的事件处理器，打印警告
        console.warn(`No emit handler for type: ${type}`);
    }
}
