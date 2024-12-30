/**
 * @module sync-protocol
 * 同步协议模块
 */

import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import * as Y from 'yjs'

/**
 * StateMap 类型定义
 */
export type StateMap = Map<number, number>

/**
 * Yjs 核心定义了两种消息类型：
 * • YjsSyncStep1: 包含发送客户端的状态集。当接收到时，客户端应该回复 YjsSyncStep2。
 * • YjsSyncStep2: 包含所有缺失的结构和完整的删除集。当接收到时，客户端可以确保它已经
 *   收到了来自远程客户端的所有信息。
 *
 * 在点对点网络中，你可能想要引入 SyncDone 消息类型。双方都应该用 SyncStep1 初始化连接。
 * 当客户端收到 SyncStep2 时，它应该回复 SyncDone。当本地客户端同时收到 SyncStep2 和
 * SyncDone 时，它可以确保已经与远程客户端同步。
 *
 * 在客户端-服务器模型中，你需要采用不同的处理方式：客户端应该用 SyncStep1 初始化连接。
 * 当服务器收到 SyncStep1 时，它应该立即回复 SyncStep2，紧接着发送 SyncStep1。当客户端
 * 收到 SyncStep1 时回复 SyncStep2。可选地，服务器在收到 SyncStep2 后可以发送 SyncDone，
 * 这样客户端就知道同步已完成。这种更复杂的同步模型有两个原因：1. 这个协议可以很容易地
 * 在 http 和 websockets 之上实现。2. 服务器应该只回复请求，而不是发起请求。因此客户端
 * 必须发起同步。
 *
 * 消息的构造：
 * [messageType : varUint, message definition..]
 *
 * 注意：消息不包含房间名称的信息。这必须由上层协议处理！
 *
 * stringify[messageType] 将消息定义字符串化(messageType 已经从缓冲区读取)
 */

export const messageYjsSyncStep1: number = 0
export const messageYjsSyncStep2: number = 1
export const messageYjsUpdate: number = 2

/**
 * 创建同步步骤1消息
 * 用于发起同步请求,包含本地文档状态向量
 * 
 * @param encoder - 编码器对象
 * @param doc - 当前文档实例
 */
export const writeSyncStep1 = (encoder: encoding.Encoder, doc: Y.Doc): void => {
  // 写入消息类型标识
  encoding.writeVarUint(encoder, messageYjsSyncStep1)
  // 获取并编码当前文档的状态向量
  // 状态向量记录了每个客户端最新的更新序号
  const sv = Y.encodeStateVector(doc)
  // 将状态向量写入为变长字节数组
  encoding.writeVarUint8Array(encoder, sv)
}

/**
 * 创建同步步骤2消息
 * 用于响应同步请求,发送增量更新数据
 *
 * @param encoder - 编码器对象 
 * @param doc - 当前文档实例
 * @param encodedStateVector - 对方的状态向量(可选)
 */
export const writeSyncStep2 = (
  encoder: encoding.Encoder,
  doc: Y.Doc,
  encodedStateVector?: Uint8Array
): void => {
  // 写入消息类型标识
  encoding.writeVarUint(encoder, messageYjsSyncStep2)

  // 根据对方状态向量编码增量更新
  // 只发送对方缺少的更新内容
  encoding.writeVarUint8Array(encoder, Y.encodeStateAsUpdate(doc, encodedStateVector))
}

/**
 * 处理同步步骤1消息
 * 读取对方状态向量并回复步骤2消息
 *
 * @param decoder - 解码器对象
 * @param encoder - 编码器对象
 * @param doc - 当前文档实例
 */
export const readSyncStep1 = (
  decoder: decoding.Decoder,
  encoder: encoding.Encoder,
  doc: Y.Doc
): void =>
  // 读取状态向量并直接调用writeSyncStep2回复
  writeSyncStep2(encoder, doc, decoding.readVarUint8Array(decoder))

/**
 * 处理同步步骤2消息
 * 将收到的增量更新应用到本地文档
 *
 * @param decoder - 解码器对象
 * @param doc - 当前文档实例
 * @param transactionOrigin - 事务来源信息
 */
export const readSyncStep2 = (
  decoder: decoding.Decoder,
  doc: Y.Doc,
  transactionOrigin: any
): void => {
  try {
    // 读取并应用增量更新
    // transactionOrigin用于标识更新来源
    Y.applyUpdate(doc, decoding.readVarUint8Array(decoder), transactionOrigin)
  } catch (error) {
    // 错误处理 - 记录日志但不中断程序
    console.error('Caught error while handling a Yjs update', error)
  }
}


/**
 * 写入更新消息
 */
export const writeUpdate = (encoder: encoding.Encoder, update: Uint8Array): void => {
  encoding.writeVarUint(encoder, messageYjsUpdate)
  encoding.writeVarUint8Array(encoder, update)
}

/**
 * 读取并将 Structs 和 DeleteStore 应用到 y 实例
 */
export const readUpdate = readSyncStep2

/**
 * 处理同步消息的函数
 * 基于 Yjs 协议规范实现文档同步的消息处理
 *
 * @param decoder - 用于解码二进制消息的解码器对象
 * @param encoder - 用于编码响应消息的编码器对象  
 * @param doc - Y.Doc 实例,代表当前文档
 * @param transactionOrigin - 事务来源信息
 * @returns 返回处理的消息类型
 */
export const readSyncMessage = (
  decoder: decoding.Decoder,
  encoder: encoding.Encoder,
  doc: Y.Doc,
  transactionOrigin: any
): number => {

  /**
   * 读取消息类型
   * 使用变长整数编码(VarUint)提高传输效率
   * VarUint 编码根据数值大小使用1-8字节不等
   */
  const messageType = decoding.readVarUint(decoder)

  /**
   * 根据消息类型分发处理
   * 实现三阶段同步协议:
   * 1. Step1 - 客户端发送状态向量,请求同步
   * 2. Step2 - 服务端响应增量更新
   * 3. Update - 实时更新推送
   */
  switch (messageType) {
    case messageYjsSyncStep1:
      // 处理同步第一步 - 读取状态向量并编码响应
      readSyncStep1(decoder, encoder, doc)
      break
    case messageYjsSyncStep2:
      // 处理同步第二步 - 合并增量更新
      readSyncStep2(decoder, doc, transactionOrigin)
      break
    case messageYjsUpdate:
      // 处理实时更新 - 直接应用更新
      readUpdate(decoder, doc, transactionOrigin)
      break
    default:
      // 未知消息类型则抛出异常
      throw new Error('Unknown message type')
  }

  /**
   * 返回消息类型供调用方使用
   * 可用于追踪消息处理流程或条件判断
   */
  return messageType
}
