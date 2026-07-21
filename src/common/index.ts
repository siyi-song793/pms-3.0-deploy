// 导出所有工具（包含你用到的 time.ts）
export * from './utils/dom';
export * from './utils/date';
// 其他工具按需追加：
export * from './error/handler';
export * from './event/bus';
export * from './gesture/core';
export * from './storage/namespace';

// 给 main.ts 调用的初始化函数
export function initCommonUtils() {
  console.log('✅ Common utils 初始化完成');
}