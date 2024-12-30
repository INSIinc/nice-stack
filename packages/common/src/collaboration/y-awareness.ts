/**
 * 此文件实现了一个基于Yjs的分布式感知协议(Awareness Protocol)
 * 用于在协同编辑场景中同步和共享非持久化的状态信息(如用户在线状态、光标位置等)
 * 
 * @author 
 * @date 2023
 */

import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as time from 'lib0/time';
import { Observable } from 'lib0/observable';
import * as f from 'lib0/function';
import * as Y from 'yjs'; // eslint-disable-line
import { YWsProvider } from './y-socket';

/**
 * 客户端状态过期的超时时间,单位为毫秒
 * 如果一个客户端超过此时间未更新状态,则认为该客户端已离线
 */
export const outdatedTimeout: number = 30000;

/**
 * MetaClientState 接口定义了客户端状态的元数据信息
 * 用于跟踪每个客户端状态的版本和最后更新时间
 * 
 * @interface
 */
export interface MetaClientState {
  clock: number; // 单调递增的时钟值,用于状态版本控制
  lastUpdated: number; // 最后一次更新的Unix时间戳
}

/**
 * StateMap类型定义了客户端ID到状态记录的映射关系
 * key为clientID,value为该客户端的状态对象
 */
type StateMap = Map<number, Record<string, any>>;


/**
 * Awareness类 - 用于管理协同编辑中的用户状态感知
 * 继承自Observable以提供事件机制
 */
export class Awareness extends Observable<string> {
  /** Yjs文档实例,用于协同编辑 */
  doc: Y.Doc;

  /** 当前客户端的唯一标识 */
  clientID: number;

  /** 存储所有客户端的状态映射表 Map<clientID, state> */
  states: StateMap;

  /** 存储所有客户端的元数据映射表 Map<clientID, MetaClientState> */
  meta: Map<number, MetaClientState>;

  /** 定时检查过期状态的定时器句柄 */
  private _checkInterval: ReturnType<typeof setInterval>;

  /**
   * 构造函数
   * @param doc Yjs文档实例
   */
  constructor(doc: Y.Doc) {
    super();

    /**
     * 初始化实例属性
     */
    this.doc = doc;
    this.clientID = doc.clientID;
    this.states = new Map();
    this.meta = new Map();

    /**
     * 创建定时器,定期检查并清理过期的客户端状态
     * 间隔为过期时间的1/10
     */
    this._checkInterval = setInterval(() => {
      const now = time.getUnixTime();

      /**
       * 如果本地状态接近过期(超过过期时间的一半),
       * 则更新状态以保持活跃
       */
      if (this.getLocalState() !== null && (outdatedTimeout / 2 <= now - (this.meta.get(this.clientID)?.lastUpdated || 0))) {
        this.setLocalState(this.getLocalState());
      }

      /**
       * 检查并移除过期的远程客户端状态
       * 过期条件:非本地客户端 && 超过过期时间 && 存在状态
       */
      const remove: number[] = [];
      this.meta.forEach((meta, clientid) => {
        if (clientid !== this.clientID && outdatedTimeout <= now - meta.lastUpdated && this.states.has(clientid)) {
          remove.push(clientid);
        }
      });
      if (remove.length > 0) {
        removeAwarenessStates(this, remove, 'timeout');
      }
    }, Math.floor(outdatedTimeout / 10));

    /**
     * 监听文档销毁事件,确保资源正确释放
     */
    doc.on('destroy', () => {
      this.destroy();
    });

    /**
     * 初始化本地状态为空对象
     */
    this.setLocalState({});
  }

  /**
   * 销毁实例,清理资源
   */
  override destroy() {
    this.emit('destroy', [this]);
    this.setLocalState(null);
    super.destroy();
    clearInterval(this._checkInterval);
  }

  /**
   * 获取本地客户端状态
   * @returns 状态对象或null
   */
  getLocalState(): Record<string, any> | null {
    return this.states.get(this.clientID) || null;
  }

  /**
   * 设置本地客户端状态
   * @param state 新的状态对象或null(表示删除状态)
   */
  setLocalState(state: Record<string, any> | null) {
    const clientID = this.clientID;
    const currLocalMeta = this.meta.get(clientID);
    const clock = currLocalMeta === undefined ? 0 : currLocalMeta.clock + 1;
    const prevState = this.states.get(clientID);

    /**
     * 更新状态
     */
    if (state === null) {
      this.states.delete(clientID);
    } else {
      this.states.set(clientID, state);
    }

    /**
     * 更新元数据(时钟值和最后更新时间)
     */
    this.meta.set(clientID, {
      clock,
      lastUpdated: time.getUnixTime()
    });

    /**
     * 跟踪状态变更类型:
     * - added: 新增的状态
     * - updated: 更新的状态
     * - filteredUpdated: 实际发生变化的更新状态
     * - removed: 移除的状态
     */
    const added: number[] = [];
    const updated: number[] = [];
    const filteredUpdated: number[] = [];
    const removed: number[] = [];

    if (state === null) {
      removed.push(clientID);
    } else if (prevState == null) {
      if (state != null) {
        added.push(clientID);
      }
    } else {
      updated.push(clientID);
      if (!f.equalityDeep(prevState, state)) {
        filteredUpdated.push(clientID);
      }
    }

    /**
     * 触发事件:
     * - change: 仅当状态实际发生变化时触发
     * - update: 所有更新操作都会触发
     */
    if (added.length > 0 || filteredUpdated.length > 0 || removed.length > 0) {
      this.emit('change', [{ added, updated: filteredUpdated, removed }, 'local']);
    }

    this.emit('update', [{ added, updated, removed }, 'local']);
  }

  /**
   * 更新本地状态的指定字段
   * @param field 字段名
   * @param value 字段值
   */
  setLocalStateField(field: string, value: any) {
    const state = this.getLocalState();
    if (state !== null) {
      this.setLocalState({
        ...state,
        [field]: value
      });
    }
  }

  /**
   * 获取所有客户端的状态映射表
   * @returns StateMap
   */
  getStates(): StateMap {
    return this.states;
  }
}

/**
 * 从Awareness中移除指定客户端的状态
 * @param awareness {Awareness} - Awareness实例
 * @param clients {number[]} - 需要移除状态的客户端ID数组
 * @param origin {any} - 状态变更的来源信息
 */
export const removeAwarenessStates = (awareness: Awareness, clients: number[], origin: any) => {

  /**
   * 记录实际被移除的客户端ID
   * 用于后续触发事件通知
   */
  const removed: number[] = [];

  /**
   * 遍历需要移除的客户端列表
   */
  for (let i = 0; i < clients.length; i++) {
    const clientID = clients[i];

    /**
     * 检查该客户端是否存在状态
     * 只处理存在状态的客户端
     */
    if (awareness.states.has(clientID)) {
      /**
       * 从states中删除该客户端状态
       */
      awareness.states.delete(clientID);

      /**
       * 特殊处理当前客户端
       * 如果移除的是当前客户端的状态:
       * 1. 获取当前meta信息
       * 2. 更新clock值(+1)和最后更新时间
       */
      if (clientID === awareness.clientID) {
        const curMeta = awareness.meta.get(clientID) as MetaClientState;
        awareness.meta.set(clientID, {
          clock: curMeta.clock + 1,
          lastUpdated: time.getUnixTime()
        });
      }

      /**
       * 将实际移除的客户端ID加入removed数组
       */
      removed.push(clientID);
    }
  }

  /**
   * 如果有状态被移除,触发事件通知
   * 包含两个事件:
   * 1. change - 状态变更事件
   * 2. update - 状态更新事件
   * 事件数据包含:
   * - added: 新增的状态(空数组)
   * - updated: 更新的状态(空数组) 
   * - removed: 移除的状态
   * - origin: 变更来源
   */
  if (removed.length > 0) {
    awareness.emit('change', [{ added: [], updated: [], removed }, origin]);
    awareness.emit('update', [{ added: [], updated: [], removed }, origin]);
  }
}



/**
 * 将Awareness状态编码为二进制更新数据
 * @param awareness {Awareness} - Awareness实例,包含状态管理相关功能
 * @param clients {number[]} - 需要编码的客户端ID数组
 * @param states {StateMap} - 状态映射表,默认使用awareness中的states
 * @returns {Uint8Array} - 编码后的二进制数据
 */
export const encodeAwarenessUpdate = (awareness: Awareness, clients: number[], states: StateMap = awareness.states): Uint8Array => {

  /**
   * 获取需要编码的客户端数量
   * 用于预分配编码空间
   */
  const len = clients.length;

  /**
   * 创建二进制编码器
   * 用于将状态数据编码为二进制格式
   */
  const encoder = encoding.createEncoder();

  /**
   * 写入客户端数量
   * 使用VarUint变长编码,节省空间
   */
  encoding.writeVarUint(encoder, len);

  /**
   * 遍历每个客户端,编码其状态信息
   */
  for (let i = 0; i < len; i++) {
    /**
     * 获取当前客户端ID
     */
    const clientID = clients[i];

    /**
     * 从states中获取该客户端的状态
     * 如果不存在则使用null
     */
    const state = states.get(clientID) || null;

    /**
     * 从awareness.meta中获取该客户端的时钟值
     * MetaClientState类型包含clock字段表示状态版本
     */
    const clock = (awareness.meta.get(clientID) as MetaClientState).clock;

    /**
     * 将客户端信息写入编码器:
     * 1. 写入clientID
     * 2. 写入clock版本号
     * 3. 将状态序列化为JSON字符串写入
     */
    encoding.writeVarUint(encoder, clientID);
    encoding.writeVarUint(encoder, clock);
    encoding.writeVarString(encoder, JSON.stringify(state));
  }

  /**
   * 将编码器中的数据转换为Uint8Array返回
   * 完成状态数据的二进制编码
   */
  return encoding.toUint8Array(encoder);
}


/**
 * 修改Awareness更新数据的工具函数
 * @param update {Uint8Array} - 原始的awareness更新二进制数据
 * @param modify {Function} - 修改状态的回调函数
 * @returns {Uint8Array} - 修改后的二进制数据
 */
export const modifyAwarenessUpdate = (update: Uint8Array, modify: (state: any) => any): Uint8Array => {

  /**
   * 创建二进制解码器,用于读取原始update数据
   * decoding模块提供了二进制数据的解码能力
   */
  const decoder = decoding.createDecoder(update);

  /**
   * 创建二进制编码器,用于写入修改后的数据
   * encoding模块提供了数据编码为二进制的能力
   */
  const encoder = encoding.createEncoder();

  /**
   * 读取update中包含的awareness状态数量
   * 使用VarUint变长编码,可以节省空间
   */
  const len = decoding.readVarUint(decoder);

  /**
   * 将状态数量写入新的编码器
   */
  encoding.writeVarUint(encoder, len);

  /**
   * 遍历处理每个awareness状态
   */
  for (let i = 0; i < len; i++) {

    /**
     * 读取每个状态的元数据:
     * - clientID: 客户端唯一标识
     * - clock: 状态版本时钟
     * - state: JSON格式的状态数据
     */
    const clientID = decoding.readVarUint(decoder);
    const clock = decoding.readVarUint(decoder);
    const state = JSON.parse(decoding.readVarString(decoder));

    /**
     * 使用modify回调函数处理状态
     * 可以对state进行任意修改
     */
    const modifiedState = modify(state);

    /**
     * 将修改后的状态写回编码器:
     * 1. 写入clientID 
     * 2. 写入clock
     * 3. 将修改后的状态序列化为JSON字符串写入
     */
    encoding.writeVarUint(encoder, clientID);
    encoding.writeVarUint(encoder, clock);
    encoding.writeVarString(encoder, JSON.stringify(modifiedState));
  }

  /**
   * 将编码器中的数据转换为Uint8Array返回
   * 完成二进制数据的重新编码
   */
  return encoding.toUint8Array(encoder);
}



/**
 * 应用Awareness状态更新的函数
 * @param awareness Awareness实例,用于管理用户状态
 * @param update 二进制格式的状态更新数据 
 * @param origin 更新的来源信息
 */
export const applyAwarenessUpdate = (awareness: Awareness, update: Uint8Array, origin: any) => {
  /**
   * 创建二进制解码器,用于解析update数据
   * Uint8Array是固定长度的8位无符号整数数组
   */
  const decoder = decoding.createDecoder(update);

  /**
   * 获取当前Unix时间戳,用于记录状态更新时间
   */
  const timestamp = time.getUnixTime();

  /**
   * 定义数组跟踪不同类型的状态变更:
   * added - 新增的客户端ID
   * updated - 所有更新的客户端ID 
   * filteredUpdated - 状态实际发生变化的客户端ID
   * removed - 移除的客户端ID
   */
  const added: number[] = [];
  const updated: number[] = [];
  const filteredUpdated: number[] = [];
  const removed: number[] = [];

  /**
   * 读取需要更新的客户端数量
   * 使用变长整数编码(VarUint)提高传输效率
   */
  const len = decoding.readVarUint(decoder);

  /**
   * 遍历处理每个客户端的状态更新
   */
  for (let i = 0; i < len; i++) {
    /**
     * 读取客户端ID、时钟值和状态数据
     * 状态数据使用JSON字符串传输,需要解析
     */
    const clientID = decoding.readVarUint(decoder);
    let clock = decoding.readVarUint(decoder);
    const state = JSON.parse(decoding.readVarString(decoder));

    /**
     * 获取客户端当前的元数据和状态
     * meta包含clock(时钟)和lastUpdated(最后更新时间)
     */
    const clientMeta = awareness.meta.get(clientID);
    const prevState = awareness.states.get(clientID);
    const currClock = clientMeta === undefined ? 0 : clientMeta.clock;

    /**
     * 时钟值更大或状态被删除时才应用更新
     * 使用逻辑时钟确保状态更新的顺序一致性
     */
    if (currClock < clock || (currClock === clock && state === null && awareness.states.has(clientID))) {
      if (state === null) {
        /**
         * 处理状态删除
         * 本地状态特殊处理:增加时钟值而不删除状态
         */
        if (clientID === awareness.clientID && awareness.getLocalState() != null) {
          clock++;
        } else {
          awareness.states.delete(clientID);
        }
      } else {
        /**
         * 更新客户端状态
         * 使用Map数据结构存储状态
         */
        awareness.states.set(clientID, state);
      }

      /**
       * 更新客户端元数据
       * 记录新的时钟值和更新时间戳
       */
      awareness.meta.set(clientID, {
        clock,
        lastUpdated: timestamp
      });

      /**
       * 根据更新类型将clientID添加到相应的跟踪数组
       * 使用深度相等性比较检测状态是否实际发生变化
       */
      if (clientMeta === undefined && state !== null) {
        added.push(clientID);
      } else if (clientMeta !== undefined && state === null) {
        removed.push(clientID);
      } else if (state !== null) {
        if (!f.equalityDeep(state, prevState)) {
          filteredUpdated.push(clientID);
        }
        updated.push(clientID);
      }
    }
  }
  if (added.length > 0 || filteredUpdated.length > 0 || removed.length > 0) {
    awareness.emit('change', [{ added, updated: filteredUpdated, removed }, origin]);
  }

  if (!(origin instanceof YWsProvider))
    awareness.emit('update', [{ added, updated, removed }, origin]);
}
