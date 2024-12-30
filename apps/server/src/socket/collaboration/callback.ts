/**
 * 此模块实现了一个回调处理系统，用于在协同编辑文档发生更改时通知外部服务。
 * 它支持多种共享数据类型(Array、Map、Text、XML等)的同步，并可以将更新通过HTTP POST请求发送到指定的回调URL。
 * 主要用于与外部系统集成，实现文档变更的实时通知。
 */

import http from 'http';
import { parseInt as libParseInt } from 'lib0/number';
import { WSSharedDoc } from './ws-shared-doc';


/**
 * 回调URL配置,从环境变量中获取
 * 如果环境变量未设置则为null
 */
const CALLBACK_URL = process.env.CALLBACK_URL ? new URL(process.env.CALLBACK_URL) : null;

/**
 * 回调超时时间配置,从环境变量中获取
 * 默认为5000毫秒
 */
const CALLBACK_TIMEOUT = libParseInt(process.env.CALLBACK_TIMEOUT || '5000');

/**
 * 需要监听变更的共享对象配置
 * 从环境变量CALLBACK_OBJECTS中解析JSON格式的配置
 */
const CALLBACK_OBJECTS: Record<string, string> = process.env.CALLBACK_OBJECTS ? JSON.parse(process.env.CALLBACK_OBJECTS) : {};

/**
 * 导出回调URL是否已配置的标志
 */
export const isCallbackSet = !!CALLBACK_URL;

/**
 * 定义要发送的数据结构接口
 */
interface DataToSend {
  room: string; // 房间/文档标识
  data: Record<string, {
    type: string; // 数据类型
    content: any; // 数据内容
  }>;
}

/**
 * 定义更新数据的类型
 */
type UpdateType = Uint8Array;

/**
 * 定义更新来源的类型
 */
type OriginType = any;

/**
 * 处理文档更新的回调函数
 * @param update - 更新的数据
 * @param origin - 更新的来源
 * @param doc - 共享文档实例
 */
export const callbackHandler = (update: UpdateType, origin: OriginType, doc: WSSharedDoc): void => {
  // 获取文档名称作为房间标识
  const room = doc.name;
  
  // 初始化要发送的数据对象
  const dataToSend: DataToSend = {
    room,
    data: {}
  };

  // 获取所有需要监听的共享对象名称
  const sharedObjectList = Object.keys(CALLBACK_OBJECTS);
  
  // 遍历所有共享对象,获取它们的最新内容
  sharedObjectList.forEach(sharedObjectName => {
    const sharedObjectType = CALLBACK_OBJECTS[sharedObjectName];
    dataToSend.data[sharedObjectName] = {
      type: sharedObjectType,
      content: getContent(sharedObjectName, sharedObjectType, doc).toJSON()
    };
  });

  // 如果配置了回调URL,则发送HTTP请求
  if (CALLBACK_URL) {
    callbackRequest(CALLBACK_URL, CALLBACK_TIMEOUT, dataToSend);
  }
};

/**
 * 发送HTTP回调请求
 * @param url - 回调的目标URL
 * @param timeout - 超时时间
 * @param data - 要发送的数据
 */
const callbackRequest = (url: URL, timeout: number, data: DataToSend): void => {
  // 将数据转换为JSON字符串
  const dataString = JSON.stringify(data);

  // 配置HTTP请求选项
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    timeout,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dataString)
    }
  };

  // 创建HTTP请求
  const req = http.request(options);

  // 处理超时事件
  req.on('timeout', () => {
    console.warn('Callback request timed out.');
    req.abort();
  });

  // 处理错误事件
  req.on('error', (e) => {
    console.error('Callback request error.', e);
    req.abort();
  });

  // 发送数据
  req.write(dataString);
  req.end();
};

/**
 * 根据对象类型获取共享对象的内容
 * @param objName - 对象名称
 * @param objType - 对象类型
 * @param doc - 共享文档实例
 * @returns 共享对象的内容
 */
const getContent = (objName: string, objType: string, doc: WSSharedDoc): any => {
  // 根据对象类型返回相应的共享对象
  switch (objType) {
    case 'Array': return doc.getArray(objName);
    case 'Map': return doc.getMap(objName);
    case 'Text': return doc.getText(objName);
    case 'XmlFragment': return doc.getXmlFragment(objName);
    case 'XmlElement': return doc.getXmlElement(objName);
    default: return {};
  }
};
